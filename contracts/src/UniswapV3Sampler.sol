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
import "./interfaces/IUniswapV3.sol";

contract UniswapV3Sampler is UniswapV3Common {
    /// @dev Gas limit for UniswapV3 calls. This is 100% a guess.
    uint256 private constant QUOTE_GAS = 700e3;

    IUniswapV3MultiQuoter private constant multiQuoter =
        IUniswapV3MultiQuoter(0x5555555555555555555555555555555555555556);

    // TODO: remove IUniswapV3QuoterV2 and instead pass in IUniswapV3Factory
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

        for (uint256 i = 0; i < poolPaths.length; ++i) {
            if (!isValidPoolPath(poolPaths[i])) {
                continue;
            }

            bytes memory uniswapPath = toUniswapPath(path, poolPaths[i]);
            (uint256[] memory amountsOut, uint256[] memory gasEstimate) = multiQuoter.quoteExactMultiInput(
                quoter.factory(),
                uniswapPath,
                takerTokenAmounts
            );

            for (uint256 j = 0; j < amountsOut.length; ++j) {
                if (makerTokenAmounts[j] < amountsOut[j]) {
                    makerTokenAmounts[j] = amountsOut[j];
                    uniswapPaths[j] = uniswapPath;
                    uniswapGasUsed[j] = gasEstimate[j];
                }
            }
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
        IERC20TokenV06[] memory reversedPath = reverseTokenPath(path);
        IUniswapV3Pool[][] memory poolPaths = _getPoolPaths(
            quoter,
            reversedPath,
            makerTokenAmounts[makerTokenAmounts.length - 1]
        );

        takerTokenAmounts = new uint256[](makerTokenAmounts.length);
        uniswapPaths = new bytes[](makerTokenAmounts.length);
        uniswapGasUsed = new uint256[](makerTokenAmounts.length);

        for (uint256 i = 0; i < poolPaths.length; ++i) {
            if (!isValidPoolPath(poolPaths[i])) {
                continue;
            }

            bytes memory uniswapPath = toUniswapPath(reversedPath, poolPaths[i]);
            (uint256[] memory amountsIn, uint256[] memory gasEstimate) = multiQuoter.quoteExactMultiOutput(
                quoter.factory(),
                uniswapPath,
                makerTokenAmounts
            );

            for (uint256 j = 0; j < amountsIn.length; ++j) {
                if (takerTokenAmounts[j] == 0 || takerTokenAmounts[j] > amountsIn[j]) {
                    takerTokenAmounts[j] = amountsIn[j];
                    uniswapPaths[j] = toUniswapPath(path, reversePoolPath(poolPaths[i]));
                    uniswapGasUsed[j] = gasEstimate[j];
                }
            }
        }
    }

    /// @dev Returns `poolPaths` to sample against. The caller is responsible for not using path involinvg zero address(es).
    function _getPoolPaths(
        IUniswapV3QuoterV2 quoter,
        IERC20TokenV06[] memory path,
        uint256 inputAmount
    ) private returns (IUniswapV3Pool[][] memory poolPaths) {
        if (path.length == 2) {
            return _getPoolPathSingleHop(quoter, path, inputAmount);
        }
        if (path.length == 3) {
            return _getPoolPathTwoHop(quoter, path, inputAmount);
        }
        revert("UniswapV3Sampler/unsupported token path length");
    }

    function _getPoolPathSingleHop(
        IUniswapV3QuoterV2 quoter,
        IERC20TokenV06[] memory path,
        uint256 inputAmount
    ) public returns (IUniswapV3Pool[][] memory poolPaths) {
        poolPaths = new IUniswapV3Pool[][](2);
        (IUniswapV3Pool[2] memory topPools, ) = _getTopTwoPools(
            quoter,
            quoter.factory(),
            path[0],
            path[1],
            inputAmount
        );

        uint256 pathCount = 0;
        for (uint256 i = 0; i < 2; i++) {
            IUniswapV3Pool topPool = topPools[i];
            poolPaths[pathCount] = new IUniswapV3Pool[](1);
            poolPaths[pathCount][0] = topPool;
            pathCount++;
        }
    }

    function _getPoolPathTwoHop(
        IUniswapV3QuoterV2 quoter,
        IERC20TokenV06[] memory path,
        uint256 inputAmount
    ) private returns (IUniswapV3Pool[][] memory poolPaths) {
        IUniswapV3Factory factory = quoter.factory();
        poolPaths = new IUniswapV3Pool[][](4);
        (IUniswapV3Pool[2] memory firstHopTopPools, uint256[2] memory firstHopAmounts) = _getTopTwoPools(
            quoter,
            factory,
            path[0],
            path[1],
            inputAmount
        );
        (IUniswapV3Pool[2] memory secondHopTopPools, ) = _getTopTwoPools(
            quoter,
            factory,
            path[1],
            path[2],
            firstHopAmounts[0]
        );

        uint256 pathCount = 0;
        for (uint256 i = 0; i < 2; i++) {
            for (uint256 j = 0; j < 2; j++) {
                poolPaths[pathCount] = new IUniswapV3Pool[](2);
                IUniswapV3Pool[] memory currentPath = poolPaths[pathCount];
                currentPath[0] = firstHopTopPools[i];
                currentPath[1] = secondHopTopPools[j];
                pathCount++;
            }
        }
    }

    /// @dev Returns top 0-2 pools and corresponding output amounts based on swaping `inputAmount`.
    /// Addresses in `topPools` can be zero addresses when there are pool isn't available.
    // TODO: test how our gas usage and latency would be affected if we got rid of 2 pool filtering.
    function _getTopTwoPools(
        IUniswapV3QuoterV2 quoter,
        IUniswapV3Factory factory,
        IERC20TokenV06 inputToken,
        IERC20TokenV06 outputToken,
        uint256 inputAmount
    ) private returns (IUniswapV3Pool[2] memory topPools, uint256[2] memory outputAmounts) {
        IERC20TokenV06[] memory path = new IERC20TokenV06[](2);
        path[0] = inputToken;
        path[1] = outputToken;

        uint24[4] memory validPoolFees = [uint24(0.0001e6), uint24(0.0005e6), uint24(0.003e6), uint24(0.01e6)];
        for (uint256 i = 0; i < validPoolFees.length; ++i) {
            IUniswapV3Pool pool = factory.getPool(address(inputToken), address(outputToken), validPoolFees[i]);
            if (!_isValidPool(pool)) {
                continue;
            }

            IUniswapV3Pool[] memory poolPath = new IUniswapV3Pool[](1);
            poolPath[0] = pool;
            bytes memory uniswapPath = toUniswapPath(path, poolPath);
            
            uint256[] amountsIn = new uint256[](1);
            amountsIn[0] = inputAmount;

            (uint256[] memory amountsOut,) = multiQuoter.quoteExactMultiInput(
                quoter.factory(),
                uniswapPath,
                takerTokenAmounts
            );

            // Keeping track of the top 2 pools.
            if (amountsOut[0] > outputAmounts[0]) {
                outputAmounts[1] = outputAmounts[0];
                topPools[1] = topPools[0];
                outputAmounts[0] = amountsOut[0];
                topPools[0] = pool;
            } else if (amountsOut[0] > outputAmounts[1]) {
                outputAmounts[1] = amountsOut[0];
                topPools[1] = pool;
            }
        }
    }

    function _isValidPool(IUniswapV3Pool pool) private view returns (bool isValid) {
        // Check if it has been deployed.
        {
            uint256 codeSize;
            assembly {
                codeSize := extcodesize(pool)
            }
            if (codeSize == 0) {
                return false;
            }
        }
        // Must have a balance of both tokens.
        if (IERC20TokenV06(pool.token0()).balanceOf(address(pool)) == 0) {
            return false;
        }
        if (IERC20TokenV06(pool.token1()).balanceOf(address(pool)) == 0) {
            return false;
        }
        return true;
    }

    function isValidPoolPath(IUniswapV3Pool[] memory poolPaths) private pure returns (bool) {
        for (uint256 i = 0; i < poolPaths.length; i++) {
            if (address(poolPaths[i]) == address(0)) {
                return false;
            }
        }
        return true;
    }
}
