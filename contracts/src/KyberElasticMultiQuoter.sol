// // SPDX-License-Identifier: Apache-2.0
// /*
//   Copyright 2021 ZeroEx Intl.
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
// */

// pragma solidity ^0.6;
// pragma experimental ABIEncoderV2;


// import {IPool, IFactory} from './interfaces/IKyberSwapElastic.sol';

// import "@uniswap/v3-core/contracts/libraries/TickMath.sol";

// /// @title Provides quotes for multiple swap amounts
// /// @notice Allows getting the expected amount out or amount in for multiple given swap amounts without executing the swap
// contract KyberElasticMultiQuoter {

//     struct SwapState {
//         // the amount remaining to be swapped in/out of the input/output asset
//         int256 amountSpecifiedRemaining;
//         // the amount already swapped out/in of the output/input asset
//         int256 amountCalculated;
//         // current sqrt(price)
//         uint160 sqrtPriceX96;
//         // the tick associated with the current price
//         int24 tick;
//         // the current liquidity in range
//         uint128 liquidity;
//         // the current quote amount we are querying liquidity for
//         uint256 amountsIndex;
//     }

//     // the intermediate calculations for each tick and quote amount
//     struct StepComputations {
//         // the price at the beginning of the step
//         uint160 sqrtPriceStartX96;
//         // the next tick to swap to from the current tick in the swap direction
//         int24 tickNext;
//         // whether tickNext is initialized or not
//         bool initialized;
//         // sqrt(price) for the next tick (1/0)
//         uint160 sqrtPriceNextX96;
//         // how much is being swapped in in this step
//         uint256 amountIn;
//         // how much is being swapped out
//         uint256 amountOut;
//         // how much fee is being paid in
//         uint256 feeAmount;
//     }

//     // the result of multiswap
//     struct MultiSwapResult {
//         // the gas estimate for each of swap amounts
//         uint256[] gasEstimates;
//         // the token0 delta for each swap amount, positive indicates sent and negative indicates receipt
//         int256[] amounts0;
//         // the token1 delta for each swap amount, positive indicates sent and negative indicates receipt
//         int256[] amounts1;
//     }


//   // TODO: same as uniswapv3 multiquoter logic. see if we can make generic.
//   function quoteExactMultiInput(IFactory factory, bytes memory path, uint256[] memory amountsIn)
//     public
//     returns (
//       uint256[] memory amountOut,
//       uint256[] memory gasEstimate
//     ) {

//         gasEstimate = new uint256[](amountsIn.length);
//         while (true) {
//             (address tokenIn, address tokenOut, uint24 fee) = path.decodeFirstPool();

//             bool zeroForOne = tokenIn < tokenOut;
//             IPool pool = factory.getPool(tokenIn, tokenOut, fee);

//             // multiswap only accepts int256[] for input amounts
//             int256[] memory amounts = new int256[](amountsIn.length);
//             for (uint256 i = 0; i < amountsIn.length; ++i) {
//                 amounts[i] = int256(amountsIn[i]);
//             }

//             MultiSwapResult memory result = multiswap(
//                 pool,
//                 zeroForOne,
//                 amounts,
//                 zeroForOne ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1
//             );

//             for (uint256 i = 0; i < amountsIn.length; ++i) {
//                 amountsIn[i] = zeroForOne ? uint256(-result.amounts1[i]) : uint256(-result.amounts0[i]);
//                 gasEstimate[i] += result.gasEstimates[i];
//             }

//             // decide whether to continue or terminate
//             if (path.hasMultiplePools()) {
//                 path = path.skipToken();
//             } else {
//                 return (amountsIn, gasEstimate);
//             }
//         }
//     }

//     /// @notice swap multiple amounts of token0 for token1 or token1 for token1
//     /// @dev The results of multiswap includes slight rounding issues resulting from rounding up/rounding down in SqrtPriceMath library
//     /// @param pool The UniswapV3 pool to simulate each of the swap amounts for
//     /// @param zeroForOne The direction of the swap, true for token0 to token1, false for token1 to token0
//     /// @param amounts The amounts of the swaps, positive values indicate exactInput and negative values indicate exact output
//     /// @param sqrtPriceLimitX96 The Q64.96 sqrt price limit. If zero for one, the price cannot be less than this
//     /// value after the swap. If one for zero, the price cannot be greater than this value after the swap
//     /// @return result The results of the swap as a MultiSwapResult struct with gas used, token0 and token1 deltas
//     function multiswap(
//         IPool pool,
//         bool zeroForOne,
//         int256[] memory amounts,
//         uint160 sqrtPriceLimitX96
//     ) private returns (MultiSwapResult memory result) {
//         result.gasEstimates = new uint256[](amounts.length);
//         result.amounts0 = new int256[](amounts.length);
//         result.amounts1 = new int256[](amounts.length);

//         uint256 gasBefore = gasleft();
//         (uint160 sqrtPriceX96Start, int24 tickStart, , , , , ) = pool.slot0();
//         int24 tickSpacing = pool.tickSpacing();
//         uint24 fee = pool.fee();

//         bool exactInput = amounts[0] > 0;

//         SwapState memory state = SwapState({
//             amountSpecifiedRemaining: amounts[0],
//             amountCalculated: 0,
//             sqrtPriceX96: sqrtPriceX96Start,
//             tick: tickStart,
//             liquidity: pool.liquidity(),
//             amountsIndex: 0
//         });

//         // continue swapping as long as we haven't used the entire input/output and haven't reached the price limit
//         while (state.amountSpecifiedRemaining != 0 && state.sqrtPriceX96 != sqrtPriceLimitX96) {
//             StepComputations memory step;

//             step.sqrtPriceStartX96 = state.sqrtPriceX96;

//             (step.tickNext, step.initialized) = nextInitializedTickWithinOneWord(
//                 pool,
//                 state.tick,
//                 tickSpacing,
//                 zeroForOne
//             );

//             // ensure that we do not overshoot the min/max tick, as the tick bitmap is not aware of these bounds
//             if (step.tickNext < TickMath.MIN_TICK) {
//                 step.tickNext = TickMath.MIN_TICK;
//             } else if (step.tickNext > TickMath.MAX_TICK) {
//                 step.tickNext = TickMath.MAX_TICK;
//             }

//             // get the price for the next tick
//             step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(step.tickNext);

//             // compute values to swap to the target tick, price limit, or point where input/output amount is exhausted
//             (state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount) = SwapMath.computeSwapStep(
//                 state.sqrtPriceX96,
//                 (zeroForOne ? step.sqrtPriceNextX96 < sqrtPriceLimitX96 : step.sqrtPriceNextX96 > sqrtPriceLimitX96)
//                     ? sqrtPriceLimitX96
//                     : step.sqrtPriceNextX96,
//                 state.liquidity,
//                 state.amountSpecifiedRemaining,
//                 fee
//             );

//             if (exactInput) {
//                 state.amountSpecifiedRemaining -= (step.amountIn + step.feeAmount).toInt256();
//                 state.amountCalculated = state.amountCalculated.sub(step.amountOut.toInt256());
//             } else {
//                 state.amountSpecifiedRemaining += step.amountOut.toInt256();
//                 state.amountCalculated = state.amountCalculated.add((step.amountIn + step.feeAmount).toInt256());
//             }

//             // shift tick if we reached the next price
//             if (state.sqrtPriceX96 == step.sqrtPriceNextX96) {
//                 // if the tick is initialized, run the tick transition
//                 if (step.initialized) {
//                     (, int128 liquidityNet, , , , , , ) = pool.ticks(step.tickNext);

//                     // if we're moving leftward, we interpret liquidityNet as the opposite sign
//                     // safe because liquidityNet cannot be type(int128).min
//                     if (zeroForOne) liquidityNet = -liquidityNet;

//                     state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet);
//                 }

//                 state.tick = zeroForOne ? step.tickNext - 1 : step.tickNext;
//             } else if (state.sqrtPriceX96 != step.sqrtPriceStartX96) {
//                 // recompute unless we're on a lower tick boundary (i.e. already transitioned ticks), and haven't moved
//                 state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
//             }

//             if (state.amountSpecifiedRemaining == 0) {
//                 (result.amounts0[state.amountsIndex], result.amounts1[state.amountsIndex]) = zeroForOne == exactInput
//                     ? (amounts[state.amountsIndex], state.amountCalculated)
//                     : (state.amountCalculated, amounts[state.amountsIndex]);

//                 result.gasEstimates[state.amountsIndex] = gasBefore - gasleft();

//                 if (state.amountsIndex == amounts.length - 1) {
//                     return (result);
//                 }

//                 state.amountsIndex += 1;
//                 state.amountSpecifiedRemaining = amounts[state.amountsIndex].sub(amounts[state.amountsIndex - 1]);
//             }
//         }

//         for (uint256 i = state.amountsIndex; i < amounts.length; ++i) {
//             (result.amounts0[i], result.amounts1[i]) = zeroForOne == exactInput
//                 ? (amounts[i] - state.amountSpecifiedRemaining, state.amountCalculated)
//                 : (state.amountCalculated, amounts[i] - state.amountSpecifiedRemaining);
//         }

//         result.gasEstimates[state.amountsIndex] = gasBefore - gasleft();
//     }


//     /// @notice Computes the position in the mapping where the initialized bit for a tick lives
//     /// @param tick The tick for which to compute the position
//     /// @return wordPos The key in the mapping containing the word in which the bit is stored
//     /// @return bitPos The bit position in the word where the flag is stored
//     function position(int24 tick) private pure returns (int16 wordPos, uint8 bitPos) {
//         wordPos = int16(tick >> 8);
//         bitPos = uint8(tick % 256);
//     }
// }
