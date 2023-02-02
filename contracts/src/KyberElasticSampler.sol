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

import "./interfaces/IMultiQuoter.sol";
import "./interfaces/IKyberElastic.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";

contract KyberElasticSampler {

    IMultiQuoter private constant multiQuoter = IMultiQuoter(0x5555555555555555555555555555555555555557);
    /// @dev Gas limit for UniswapV3 calls
    uint256 private constant QUOTE_GAS = 10000e3;

    /// @dev Sample sell quotes from KyberElastic.
    /// @param factory KyberElastic factory contract.
    /// @param path Token route. Should be takerToken -> makerToken (at most two hops).
    /// @param inputAmounts Taker token sell amount for each sample.
    /// @return paths The encoded KyberElastic path for each sample.
    /// @return gasEstimates Estimated amount of gas used
    /// @return outputAmounts Maker amounts bought at each taker token amount.
    function sampleSellsFromKyberElastic(
        IFactory factory,
        address[] memory path,
        uint256[] memory inputAmounts
    )
        public
        returns (bytes[] memory paths, uint256[] memory gasEstimates, uint256[] memory outputAmounts)
    {
        IPool[][] memory poolPaths = _getPoolPaths(
            factory,
            path,
            inputAmounts[inputAmounts.length - 1]
        );

        outputAmounts = new uint256[](inputAmounts.length);
        paths = new bytes[](inputAmounts.length);
        gasEstimates = new uint256[](inputAmounts.length);

        for (uint256 i = 0; i < poolPaths.length; ++i) {
            if (!isValidPoolPath(poolPaths[i])) {
                continue;
            }

            bytes memory uniswapPath = toPath(path, poolPaths[i]);

            (uint256[] memory amountsOut, uint256[] memory gasEstimate) = multiQuoter.quoteExactMultiInput(
                factory,
                uniswapPath,
                inputAmounts
            );

            for (uint256 j = 0; j < outputAmounts.length; ++j) {
                if (outputAmounts[j] < amountsOut[j]) {
                    outputAmounts[j] = amountsOut[j];
                    paths[j] = uniswapPath;
                    gasEstimates[j] = gasEstimate[j];
                }
            }
        }





    }

    /// @dev Sample buy quotes from KyberElastic.
    /// @param factory KyberElastic factory contract.
    /// @param path Token route. Should be takerToken -> makerToken (at most two hops).
    /// @param inputAmounts Taker token sell amount for each sample.
    /// @return paths The encoded KyberElastic path for each sample.
    /// @return gasEstimates Estimated amount of gas used
    /// @return outputAmounts Maker amounts bought at each taker token amount.
    function sampleBuysFromKyberElastic(
        IFactory factory,
        address[] memory path,
        uint256[] memory inputAmounts
    )
        public
        returns (bytes[] memory paths, uint256[] memory gasEstimates, uint256[] memory outputAmounts)
    {

        outputAmounts = new uint256[](inputAmounts.length);
        paths = new bytes[](inputAmounts.length);
        gasEstimates = new uint256[](inputAmounts.length);

    }

    /// @dev Returns `poolPaths` to sample against. The caller is responsible for not using path involinvg zero address(es).
    function _getPoolPaths(
        IFactory factory,
        address[] memory path,
        uint256 inputAmount
    ) private returns (IPool[][] memory poolPaths) {
        if (path.length == 2) {
            return _getPoolPathSingleHop(factory, path, inputAmount);
        }
        if (path.length == 3) {
            return _getPoolPathTwoHop(factory, path, inputAmount);
        }
        revert("UniswapV3Sampler/unsupported token path length");
    }

    function _getPoolPathSingleHop(
        IFactory factory,
        address[] memory path,
        uint256 inputAmount
    ) public returns (IPool[][] memory poolPaths) {
        poolPaths = new IPool[][](2);
        (IPool[2] memory topPools, ) = _getTopTwoPools(factory, path[0], path[1], inputAmount);

        uint256 pathCount = 0;
        for (uint256 i = 0; i < 2; i++) {
            IPool topPool = topPools[i];
            poolPaths[pathCount] = new IPool[](1);
            poolPaths[pathCount][0] = topPool;
            pathCount++;
        }
    }

    function _getPoolPathTwoHop(
        IFactory factory,
        address[] memory path,
        uint256 inputAmount
    ) private returns (IPool[][] memory poolPaths) {
        poolPaths = new IPool[][](4);
        (IPool[2] memory firstHopTopPools, uint256[2] memory firstHopAmounts) = _getTopTwoPools(
            factory,
            path[0],
            path[1],
            inputAmount
        );
        (IPool[2] memory secondHopTopPools, ) = _getTopTwoPools(factory, path[1], path[2], firstHopAmounts[0]);

        uint256 pathCount = 0;
        for (uint256 i = 0; i < 2; i++) {
            for (uint256 j = 0; j < 2; j++) {
                poolPaths[pathCount] = new IPool[](2);
                IPool[] memory currentPath = poolPaths[pathCount];
                currentPath[0] = firstHopTopPools[i];
                currentPath[1] = secondHopTopPools[j];
                pathCount++;
            }
        }
    }

    /// @dev Returns top 0-2 pools and corresponding output amounts based on swaping `inputAmount`.
    /// Addresses in `topPools` can be zero addresses when there are pool isn't available.
    function _getTopTwoPools(
        IFactory factory,
        address inputToken,
        address outputToken,
        uint256 inputAmount
    ) private returns (IPool[2] memory topPools, uint256[2] memory outputAmounts) {
        address[] memory path = new address[](2);
        path[0] = inputToken;
        path[1] = outputToken;

        uint256[] memory inputAmounts = new uint256[](1);
        inputAmounts[0] = inputAmount;

        uint24[4] memory validPoolFees = [uint24(0.0001e6), uint24(0.0005e6), uint24(0.003e6), uint24(0.01e6)];
        for (uint256 i = 0; i < validPoolFees.length; ++i) {
            IPool pool = IPool(factory.getPool(address(inputToken), address(outputToken), validPoolFees[i]));
            if (!_isValidPool(pool)) {
                continue;
            }

            IPool[] memory poolPath = new IPool[](1);
            poolPath[0] = pool;
            bytes memory uniswapPath = toPath(path, poolPath);

            try multiQuoter.quoteExactMultiInput{gas: QUOTE_GAS}(factory, uniswapPath, inputAmounts) returns (
                uint256[] memory amountsOut,
                uint256[] memory /* gasEstimate */
            ) {
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
            } catch {}
        }
    }

    function _isValidPool(IPool pool) private view returns (bool isValid) {
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

    function isValidPoolPath(IPool[] memory poolPaths) private pure returns (bool) {
        for (uint256 i = 0; i < poolPaths.length; i++) {
            if (address(poolPaths[i]) == address(0)) {
                return false;
            }
        }
        return true;
    }
    function toPath(address[] memory tokenPath, IPool[] memory poolPath) internal view returns (bytes memory path) {
        require(tokenPath.length >= 2 && tokenPath.length == poolPath.length + 1, "invalid path lengths");
        // paths are tightly packed as:
        // [token0, token0token1PairFee, token1, token1Token2PairFee, token2, ...]
        path = new bytes(tokenPath.length * 20 + poolPath.length * 3);
        uint256 o;
        assembly {
            o := add(path, 32)
        }
        for (uint256 i = 0; i < tokenPath.length; ++i) {
            if (i > 0) {
                uint24 poolFee = poolPath[i - 1].swapFeeUnits();
                assembly {
                    mstore(o, shl(232, poolFee))
                    o := add(o, 3)
                }
            }
            address token = tokenPath[i];
            assembly {
                mstore(o, shl(96, token))
                o := add(o, 20)
            }
        }
    }

}
