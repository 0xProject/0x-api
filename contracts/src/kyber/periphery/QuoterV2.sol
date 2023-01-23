// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.9;
pragma abicoder v2;

import {SafeCast} from '../libraries/SafeCast.sol';
import {TickMath} from '../libraries/TickMath.sol';
import {PathHelper} from './libraries/PathHelper.sol';
import {PoolAddress} from './libraries/PoolAddress.sol';
import {PoolTicksCounter} from './libraries/PoolTicksCounter.sol';

import {IPool} from '../interfaces/IPool.sol';
import {IFactory} from '../interfaces/IFactory.sol';
import {ISwapCallback} from '../interfaces/callback/ISwapCallback.sol';
import {IQuoterV2} from '../interfaces/periphery/IQuoterV2.sol';

/// @title Provides quotes for swaps
/// @notice Allows getting the expected amount out or amount in for a given swap without executing the swap
/// @dev These functions are not gas efficient and should _not_ be called on chain. Instead, optimistically execute
/// the swap and check the amounts in the callback.
contract QuoterV2 is IQuoterV2, ISwapCallback {
  using PathHelper for bytes;
  using SafeCast for uint256;

  address public immutable factory;
  bytes32 internal immutable poolInitHash;

  /// @dev Transient storage variable used to check a safety condition in exact output swaps.
  uint256 private amountOutCached;

  constructor(address _factory) {
    factory = _factory;
    poolInitHash = IFactory(_factory).poolInitHash();
  }

  /**
   * @dev Returns the pool address for the requested token pair swap fee
   * Because the function calculates it instead of fetching the address from the factory,
   * the returned pool address may not be in existence yet
   */
  function _getPool(
    address tokenA,
    address tokenB,
    uint24 feeUnits
  ) private view returns (IPool) {
    return IPool(PoolAddress.computeAddress(factory, tokenA, tokenB, feeUnits, poolInitHash));
  }

  /// @inheritdoc ISwapCallback
  function swapCallback(
    int256 amount0Delta,
    int256 amount1Delta,
    bytes memory path
  ) external view override {
    require(amount0Delta > 0 || amount1Delta > 0); // swaps entirely within 0-liquidity regions are not supported
    (address tokenIn, address tokenOut, uint24 feeUnits) = path.decodeFirstPool();
    IPool pool = _getPool(tokenIn, tokenOut, feeUnits);
    require(address(pool) == msg.sender, 'invalid sender');
    (uint160 afterSqrtP, , int24 nearestCurrentTickAfter, ) = pool.getPoolState();

    (bool isExactInput, uint256 amountToPay, uint256 amountReceived) = amount0Delta > 0
      ? (tokenIn < tokenOut, uint256(amount0Delta), uint256(-amount1Delta))
      : (tokenOut < tokenIn, uint256(amount1Delta), uint256(-amount0Delta));

    if (isExactInput) {
      assembly {
        let ptr := mload(0x40)
        mstore(ptr, amountToPay)
        mstore(add(ptr, 0x20), amountReceived)
        mstore(add(ptr, 0x40), afterSqrtP)
        mstore(add(ptr, 0x60), nearestCurrentTickAfter)
        revert(ptr, 128)
      }
    } else {
      // if the cache has been populated, ensure that the full output amount has been received
      if (amountOutCached != 0) require(amountReceived == amountOutCached);
      assembly {
        let ptr := mload(0x40)
        mstore(ptr, amountReceived)
        mstore(add(ptr, 0x20), amountToPay)
        mstore(add(ptr, 0x40), afterSqrtP)
        mstore(add(ptr, 0x60), nearestCurrentTickAfter)
        revert(ptr, 128)
      }
    }
  }

  /// @dev Parses a revert reason that should contain the numeric quote
  function _parseRevertReason(bytes memory reason)
    private
    pure
    returns (
      uint256 usedAmount,
      uint256 returnedAmount,
      uint160 afterSqrtP,
      int24 tickAfter
    )
  {
    if (reason.length != 128) {
      if (reason.length < 68) revert('Unexpected error');
      assembly {
        reason := add(reason, 0x04)
      }
      revert(abi.decode(reason, (string)));
    }
    return abi.decode(reason, (uint256, uint256, uint160, int24));
  }

  function _handleRevert(
    bytes memory reason,
    IPool pool,
    uint256 gasEstimate
  ) private view returns (QuoteOutput memory output) {
    int24 nearestCurrentTickBefore;
    int24 nearestCurrentTickAfter;
    (, , nearestCurrentTickBefore, ) = pool.getPoolState();
    (
      output.usedAmount,
      output.returnedAmount,
      output.afterSqrtP,
      nearestCurrentTickAfter
    ) = _parseRevertReason(reason);
    output.initializedTicksCrossed = PoolTicksCounter.countInitializedTicksCrossed(
      pool,
      nearestCurrentTickBefore,
      nearestCurrentTickAfter
    );
    output.gasEstimate = gasEstimate;
  }

  function quoteExactInputSingle(QuoteExactInputSingleParams memory params)
    public
    override
    returns (QuoteOutput memory output)
  {
    // if tokenIn < tokenOut, token input and specified token is token0, swap from 0 to 1
    bool isToken0 = params.tokenIn < params.tokenOut;
    IPool pool = _getPool(params.tokenIn, params.tokenOut, params.feeUnits);
    bytes memory data = abi.encodePacked(params.tokenIn, params.feeUnits, params.tokenOut);
    uint160 priceLimit = params.limitSqrtP == 0
      ? (isToken0 ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1)
      : params.limitSqrtP;
    uint256 gasBefore = gasleft();
    try pool.swap(address(this), params.amountIn.toInt256(), isToken0, priceLimit, data) {} catch (
      bytes memory reason
    ) {
      uint256 gasEstimate = gasBefore - gasleft();
      output = _handleRevert(reason, pool, gasEstimate);
    }
  }

  function quoteExactInput(bytes memory path, uint256 amountIn)
    public
    override
    returns (
      uint256 amountOut,
      uint160[] memory afterSqrtPList,
      uint32[] memory initializedTicksCrossedList,
      uint256 gasEstimate
    )
  {
    afterSqrtPList = new uint160[](path.numPools());
    initializedTicksCrossedList = new uint32[](path.numPools());

    uint256 i = 0;
    while (true) {
      (address tokenIn, address tokenOut, uint24 feeUnits) = path.decodeFirstPool();

      // the outputs of prior swaps become the inputs to subsequent ones
      QuoteOutput memory quoteOutput = quoteExactInputSingle(
        QuoteExactInputSingleParams({
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          feeUnits: feeUnits,
          amountIn: amountIn,
          limitSqrtP: 0
        })
      );

      afterSqrtPList[i] = quoteOutput.afterSqrtP;
      initializedTicksCrossedList[i] = quoteOutput.initializedTicksCrossed;
      amountIn = quoteOutput.returnedAmount;
      gasEstimate += quoteOutput.gasEstimate;
      i++;

      // decide whether to continue or terminate
      if (path.hasMultiplePools()) {
        path = path.skipToken();
      } else {
        return (amountIn, afterSqrtPList, initializedTicksCrossedList, gasEstimate);
      }
    }
  }

  function quoteExactOutputSingle(QuoteExactOutputSingleParams memory params)
    public
    override
    returns (QuoteOutput memory output)
  {
    // if tokenIn > tokenOut, output token and specified token is token0, swap from token1 to token0
    bool isToken0 = params.tokenIn > params.tokenOut;
    IPool pool = _getPool(params.tokenIn, params.tokenOut, params.feeUnits);

    // if no price limit has been specified, cache the output amount for comparison in the swap callback
    if (params.limitSqrtP == 0) amountOutCached = params.amount;
    uint256 gasBefore = gasleft();
    try
      pool.swap(
        address(this), // address(0) might cause issues with some tokens
        -params.amount.toInt256(),
        isToken0,
        params.limitSqrtP == 0
          ? (isToken0 ? TickMath.MAX_SQRT_RATIO - 1 : TickMath.MIN_SQRT_RATIO + 1)
          : params.limitSqrtP,
        abi.encodePacked(params.tokenOut, params.feeUnits, params.tokenIn)
      )
    {} catch (bytes memory reason) {
      uint256 gasEstimate = gasBefore - gasleft();
      if (params.limitSqrtP == 0) delete amountOutCached; // clear cache
      output = _handleRevert(reason, pool, gasEstimate);
    }
  }

  function quoteExactOutput(bytes memory path, uint256 amountOut)
    public
    override
    returns (
      uint256 amountIn,
      uint160[] memory afterSqrtPList,
      uint32[] memory initializedTicksCrossedList,
      uint256 gasEstimate
    )
  {
    afterSqrtPList = new uint160[](path.numPools());
    initializedTicksCrossedList = new uint32[](path.numPools());

    uint256 i = 0;
    while (true) {
      (address tokenOut, address tokenIn, uint24 feeUnits) = path.decodeFirstPool();

      // the inputs of prior swaps become the outputs of subsequent ones
      QuoteOutput memory quoteOutput = quoteExactOutputSingle(
        QuoteExactOutputSingleParams({
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          amount: amountOut,
          feeUnits: feeUnits,
          limitSqrtP: 0
        })
      );
      afterSqrtPList[i] = quoteOutput.afterSqrtP;
      initializedTicksCrossedList[i] = quoteOutput.initializedTicksCrossed;
      amountOut = quoteOutput.returnedAmount;
      gasEstimate += quoteOutput.gasEstimate;
      i++;

      // decide whether to continue or terminate
      if (path.hasMultiplePools()) {
        path = path.skipToken();
      } else {
        return (amountOut, afterSqrtPList, initializedTicksCrossedList, gasEstimate);
      }
    }
  }
}
