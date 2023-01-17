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

contract UniswapV3Sampler is UniswapV3Common {
    /// @dev Sample sell quotes from UniswapV3.
    /// @param quoter UniswapV3 Quoter contract.
    /// @param path Token route. Should be takerToken -> makerToken (at most two hops).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return uniswapPaths The encoded uniswap path for each sample.
    /// @return uniswapGasUsed Estimated amount of gas used
    /// @return makerTokenAmounts Maker amounts bought at each taker token amount.
    function sampleSellsFromUniswapV3(
        IUniswapV3QuoterV2 quoter,
        IERC20TokenV06[] memory path,
        uint256[] memory takerTokenAmounts
    )
        public
        returns (bytes[] memory uniswapPaths, uint256[] memory uniswapGasUsed, uint256[] memory makerTokenAmounts)
    {
        IUniswapV3Pool[][] memory poolPaths = _getPoolPaths(
            quoter,
            path,
            takerTokenAmounts[takerTokenAmounts.length - 1]
        );

        makerTokenAmounts = new uint256[](takerTokenAmounts.length);
        uniswapPaths = new bytes[](takerTokenAmounts.length);
        uniswapGasUsed = new uint256[](takerTokenAmounts.length);

        for (uint256 i = 0; i < takerTokenAmounts.length; ++i) {
            // Pick the best result from the pool paths.
            uint256 topBuyAmount = 0;
            for (uint256 j = 0; j < poolPaths.length; ++j) {
                if (!isValidPoolPath(poolPaths[j])) {
                    continue;
                }

                bytes memory uniswapPath = _toUniswapPath(path, poolPaths[j]);
                try quoter.quoteExactInput{gas: QUOTE_GAS}(uniswapPath, takerTokenAmounts[i]) returns (
                    uint256 buyAmount,
                    uint160[] memory /* sqrtPriceX96AfterList */,
                    uint32[] memory /* initializedTicksCrossedList */,
                    uint256 gasUsed
                ) {
                    if (topBuyAmount <= buyAmount) {
                        topBuyAmount = buyAmount;
                        uniswapPaths[i] = uniswapPath;
                        uniswapGasUsed[i] = gasUsed;
                    }
                } catch {}
            }
            // Break early if we can't complete the sells.
            if (topBuyAmount == 0) {
                // HACK(kimpers): To avoid too many local variables, paths and gas used is set directly in the loop
                // then reset if no valid valid quote was found
                uniswapPaths[i] = "";
                uniswapGasUsed[i] = 0;
                break;
            }
            makerTokenAmounts[i] = topBuyAmount;
        }
    }

    /// @dev Sample buy quotes from UniswapV3.
    /// @param quoter UniswapV3 Quoter contract.
    /// @param path Token route. Should be takerToken -> makerToken (at most two hops).
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return uniswapPaths The encoded uniswap path for each sample.
    /// @return uniswapGasUsed Estimated amount of gas used
    /// @return takerTokenAmounts Taker amounts sold at each maker token amount.
    function sampleBuysFromUniswapV3(
        IUniswapV3QuoterV2 quoter,
        IERC20TokenV06[] memory path,
        uint256[] memory makerTokenAmounts
    )
        public
        returns (bytes[] memory uniswapPaths, uint256[] memory uniswapGasUsed, uint256[] memory takerTokenAmounts)
    {
        IERC20TokenV06[] memory reversedPath = _reverseTokenPath(path);
        IUniswapV3Pool[][] memory poolPaths = _getPoolPaths(
            quoter,
            reversedPath,
            makerTokenAmounts[makerTokenAmounts.length - 1]
        );

        takerTokenAmounts = new uint256[](makerTokenAmounts.length);
        uniswapPaths = new bytes[](makerTokenAmounts.length);
        uniswapGasUsed = new uint256[](makerTokenAmounts.length);

        for (uint256 i = 0; i < makerTokenAmounts.length; ++i) {
            // Pick the best result from the pool paths.
            uint256 topSellAmount = 0;
            for (uint256 j = 0; j < poolPaths.length; ++j) {
                if (!isValidPoolPath(poolPaths[j])) {
                    continue;
                }

                // quoter requires path to be reversed for buys.
                bytes memory uniswapPath = _toUniswapPath(reversedPath, poolPaths[j]);
                try quoter.quoteExactOutput{gas: QUOTE_GAS}(uniswapPath, makerTokenAmounts[i]) returns (
                    uint256 sellAmount,
                    uint160[] memory /* sqrtPriceX96AfterList */,
                    uint32[] memory /* initializedTicksCrossedList */,
                    uint256 gasUsed
                ) {
                    if (topSellAmount == 0 || topSellAmount >= sellAmount) {
                        topSellAmount = sellAmount;
                        // But the output path should still be encoded for sells.
                        uniswapPaths[i] = _toUniswapPath(path, _reversePoolPath(poolPaths[j]));
                        uniswapGasUsed[i] = gasUsed;
                    }
                } catch {}
            }
            // Break early if we can't complete the buys.
            if (topSellAmount == 0) {
                // HACK(kimpers): To avoid too many local variables, paths and gas used is set directly in the loop
                // then reset if no valid valid quote was found
                uniswapPaths[i] = "";
                uniswapGasUsed[i] = 0;
                break;
            }
            takerTokenAmounts[i] = topSellAmount;
        }
    }
}
