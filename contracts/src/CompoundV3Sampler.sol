// SPDX-License-Identifier: Apache-2.0
/*

  Copyright 2021 ZeroEx Intl.

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
import "./SamplerUtils.sol";
import "./ApproximateBuys.sol";

interface Comet {

    function baseToken() virtual external view returns (address); 

    function quoteCollateral(address asset, uint baseAmount) override public view returns (uint)
}

contract CompoundV3Sampler is SamplerUtils {

     function query(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        address comet
    ) internal view returns (uint256 amountOut) {
        if (amountIn == 0) {
            return 0;
        }
        address baseToken = Comet(comet).baseToken();
        if (tokenIn == baseToken) {
            amountOut = Comet(comet).querySellQuote(tokenOut, amountIn);
        } else if (tokenOut == baseToken) {
            amountOut = Comet(comet).querySellBase(tokenIn, amountIn);
        } else {
            uint256 quoteAmount = IWooPP(pool).querySellBase(tokenIn, amountIn);
            amountOut = IWooPP(pool).querySellQuote(tokenOut, quoteAmount);
        }
    }

    /// @dev Sample sell quotes from WooFI.
    /// @param pool Address of the pool we are sampling from
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample (sorted in ascending order).
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromCompoundV3(
        address pool,
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    ) public view returns (uint256[] memory makerTokenAmounts) {
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            makerTokenAmounts[i] = query(takerTokenAmounts[i], takerToken, makerToken, pool);

            if (makerTokenAmounts[i] == 0) {
                break;
            }
        }
    }

    /// @dev Sample buy quotes from CompoundV3.
    /// @param pool Address of the pool we are sampling from
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token sell amount for each sample (sorted in ascending order).
    /// @return takerTokenAmounts Taker amounts bought at each taker token
    ///         amount.
    function sampleBuysFromCompoundV3(
        address pool,
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    ) public view returns (uint256[] memory takerTokenAmounts) {
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = _sampleApproximateBuys(
            ApproximateBuyQuoteOpts({
                takerTokenData: abi.encode(pool, takerToken, makerToken),
                makerTokenData: abi.encode(pool, makerToken, takerToken),
                getSellQuoteCallback: _sampleSellForApproximateBuyFromWoofi
            }),
            makerTokenAmounts
        );
    }

    function _sampleSellForApproximateBuyFromCompoundV3(
        bytes memory takerTokenData,
        bytes memory makerTokenData,
        uint256 sellAmount
    ) internal view returns (uint256) {
        (address _pool, address _takerToken, address _makerToken) = abi.decode(
            takerTokenData,
            (address, address, address)
        );
        (bool success, bytes memory resultData) = address(this).staticcall(
            abi.encodeWithSelector(
                this.sampleSellsFromWooPP.selector,
                _pool,
                _takerToken,
                _makerToken,
                _toSingleValueArray(sellAmount)
            )
        );
        if (!success) {
            return 0;
        }
        return abi.decode(resultData, (uint256[]))[0];
    }
}
