// SPDX-License-Identifier: Apache-2.0
/*

  Copyright 2022 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.6;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "./UniswapV3Common.sol";

contract UniswapV3Interpolator is UniswapV3Common {
    struct TickInfo {
        int24 tick;
        int128 liquidityNet;
        uint128 liquidityGross;
    }

    struct PoolInterpolationData {
        TickInfo[] interpolationTicks;
        uint160 sqrtPriceX96;
    }

    /// @dev Get interpolated pool data for Uniswap V3 sells.
    /// @param quoter UniswapV3 Quoter contract.
    /// @param path Token route. Should be takerToken -> makerToken (at most two hops).
    /// @param takerTokenAmount Taker token sell amount for sample.
    /// @return uniswapPaths The encoded uniswap path for each poolData array.
    /// @return poolData The pool data required for interpolation indexed by path and then pool.
    function getSellInterpolationDataFromUniswapV3(
        IUniswapV3QuoterV2 quoter,
        IERC20TokenV06[] memory path,
        uint256 takerTokenAmount
    ) public returns (bytes[] memory uniswapPaths, PoolInterpolationData[][] memory poolData) {
        IUniswapV3Pool[][] memory poolPaths = _getPoolPaths(quoter, path, takerTokenAmount);

        uniswapPaths = new bytes[](poolPaths.length);
        poolData = new PoolInterpolationData[][](poolPaths.length);

        for (uint256 i = 0; i < poolPaths.length; ++i) {
            if (!isValidPoolPath(poolPaths[i])) {
                continue;
            }

            bytes memory uniswapPath = _toUniswapPath(path, poolPaths[i]);
            uniswapPaths[i] = uniswapPath;
            poolData[i] = new PoolInterpolationData[](poolPaths[i].length);

            try quoter.quoteExactInput{gas: QUOTE_GAS}(uniswapPath, takerTokenAmount) returns (
                uint256 /* amountOut */,
                uint160[] memory /* sqrtPriceX96AfterList */,
                uint32[] memory initializedTicksCrossedList,
                uint256 /* gasEstimate */
            ) {
                for (uint256 j = 0; j < poolPaths[i].length; ++j) {
                    // token0 is always first alphabetically
                    bool zeroForOne = address(path[j]) < address(path[j + 1]);
                    // we want to get initializedTicksCrossedlist + 1 since _getPoolInterpolationData includes the current tick
                    poolData[i][j] = _getPoolInterpolationData(
                        poolPaths[i][j],
                        initializedTicksCrossedList[j] + 1,
                        zeroForOne
                    );
                }
            } catch {}
        }
    }

    /// @dev Get interpolated pool data for Uniswap V3 buys.
    /// @param quoter UniswapV3 Quoter contract.
    /// @param path Token route. Should be takerToken -> makerToken (at most two hops).
    /// @param makerTokenAmount Maker token buy amount for sample.
    /// @return uniswapPaths The encoded uniswap path for each poolData array.
    /// @return poolData The pool data required for interpolation indexed by path and then pool.
    function getBuyInterpolationDataFromUniswapV3(
        IUniswapV3QuoterV2 quoter,
        IERC20TokenV06[] memory path,
        uint256 makerTokenAmount
    ) public returns (bytes[] memory uniswapPaths, PoolInterpolationData[][] memory poolData) {
        IERC20TokenV06[] memory reversedPath = _reverseTokenPath(path);
        IUniswapV3Pool[][] memory poolPaths = _getPoolPaths(quoter, reversedPath, makerTokenAmount);

        uniswapPaths = new bytes[](poolPaths.length);
        poolData = new PoolInterpolationData[][](poolPaths.length);

        for (uint256 i = 0; i < poolPaths.length; ++i) {
            if (!isValidPoolPath(poolPaths[i])) {
                continue;
            }

            bytes memory uniswapPath = _toUniswapPath(reversedPath, poolPaths[i]);
            uniswapPaths[i] = _toUniswapPath(path, _reversePoolPath(poolPaths[i]));
            poolData[i] = new PoolInterpolationData[](poolPaths[i].length);

            try quoter.quoteExactOutput{gas: QUOTE_GAS}(uniswapPath, makerTokenAmount) returns (
                uint256 /* amountOut */,
                uint160[] memory /* sqrtPriceX96AfterList */,
                uint32[] memory initializedTicksCrossedList,
                uint256 /* gasEstimate */
            ) {
                for (uint256 j = 0; j < poolPaths[i].length; ++j) {
                    // token0 is always first alphabetically
                    bool zeroForOne = address(path[j]) < address(path[j + 1]);
                    // we want to get initializedTicksCrossedlist + 1 since _getPoolInterpolationData includes the current tick
                    uint256 reversedIndex = poolPaths[i].length - j - 1;
                    poolData[i][j] = _getPoolInterpolationData(
                        poolPaths[i][reversedIndex],
                        initializedTicksCrossedList[reversedIndex] + 1,
                        zeroForOne
                    );
                }
            } catch {}
        }
    }

    function _getPoolInterpolationData(
        IUniswapV3Pool pool,
        uint32 numTicksToGet,
        bool zeroForOne
    ) private returns (PoolInterpolationData memory data) {
        (uint160 sqrtPriceX96, int24 tick, , , , , ) = pool.slot0();
        data.sqrtPriceX96 = sqrtPriceX96;
        data.interpolationTicks = new TickInfo[](numTicksToGet);
        uint32 currNumTicks = 0;

        int24 tickSpacing = pool.tickSpacing();
        int24 compressed = tick / tickSpacing;
        int16 wordOffset = int16(compressed >> 8);
        uint8 bitOffset = uint8(tick % 256);

        while (currNumTicks < numTicksToGet) {
            if (wordOffset < int16(MIN_TICK >> 8) || wordOffset > int16(MAX_TICK >> 8)) {
                return data;
            }

            uint256 bitmap = pool.tickBitmap(wordOffset);
            uint256 i = bitOffset;
            // search right to left if zeroForOne, else search left to right
            while ((zeroForOne && i >= 0) || (!zeroForOne && i < 256)) {
                if (currNumTicks == numTicksToGet) {
                    return data;
                }

                if (bitmap & (1 << i) > 0) {
                    int24 populatedTick = ((int24(wordOffset) << 8) + int24(i)) * tickSpacing;
                    (uint128 liquidityGross, int128 liquidityNet, , , , , , ) = pool.ticks(populatedTick);
                    data.interpolationTicks[++currNumTicks] = TickInfo({
                        tick: populatedTick,
                        liquidityNet: liquidityNet,
                        liquidityGross: liquidityGross
                    });
                }

                if (zeroForOne) {
                    --i;
                } else {
                    ++i;
                }
            }

            if (zeroForOne) {
                --wordOffset;
                bitOffset = 255;
            } else {
                ++wordOffset;
                bitOffset = 0;
            }
        }
    }
}
