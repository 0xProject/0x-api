// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IBasePositionManagerEvents {
  /// @notice Emitted when a token is minted for a given position
  /// @param tokenId the newly minted tokenId
  /// @param poolId poolId of the token
  /// @param liquidity liquidity minted to the position range
  /// @param amount0 token0 quantity needed to mint the liquidity
  /// @param amount1 token1 quantity needed to mint the liquidity
  event MintPosition(
    uint256 indexed tokenId,
    uint80 indexed poolId,
    uint128 liquidity,
    uint256 amount0,
    uint256 amount1
  );

  /// @notice Emitted when a token is burned
  /// @param tokenId id of the token
  event BurnPosition(uint256 indexed tokenId);

  /// @notice Emitted when add liquidity
  /// @param tokenId id of the token
  /// @param liquidity the increase amount of liquidity
  /// @param amount0 token0 quantity needed to increase liquidity
  /// @param amount1 token1 quantity needed to increase liquidity
  /// @param additionalRTokenOwed additional rToken earned
  event AddLiquidity(
    uint256 indexed tokenId,
    uint128 liquidity,
    uint256 amount0,
    uint256 amount1,
    uint256 additionalRTokenOwed
  );

  /// @notice Emitted when remove liquidity
  /// @param tokenId id of the token
  /// @param liquidity the decease amount of liquidity
  /// @param amount0 token0 quantity returned when remove liquidity
  /// @param amount1 token1 quantity returned when remove liquidity
  /// @param additionalRTokenOwed additional rToken earned
  event RemoveLiquidity(
    uint256 indexed tokenId,
    uint128 liquidity,
    uint256 amount0,
    uint256 amount1,
    uint256 additionalRTokenOwed
  );
}
