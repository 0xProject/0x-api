pragma solidity >=0.6.0;
pragma experimental ABIEncoderV2;

import "forge-std/Test.sol";
import "../src/KyberElasticMultiQuoter.sol";

import {IPool} from "../src/interfaces/IKyberSwapElastic.sol";
import "@kyberelastic/interfaces/IFactory.sol";
import "@kyberelastic/interfaces/periphery/IQuoterV2.sol";

contract TestKyberElasticSampler is Test {
    /// @dev error threshold in wei for comparison between MultiQuoter and Kyber's official QuoterV2.
    /// MultiQuoter results in some rounding errors due to SqrtPriceMath library.
    uint256 constant ERROR_THRESHOLD = 50;

    address constant KNC = 0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202;
    address constant ETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    IPool constant ETH_KNC_POOL_100_BIP = IPool(0xB5e643250FF59311071C5008f722488543DD7b3C);
    IPool constant ETH_KNC_POOL_30_BIP = IPool(0xa38a0165e82B7a5E8650109E9e54087a34C93020);

    IQuoterV2 constant kyberQuoter = IQuoterV2(0x0D125c15D54cA1F8a813C74A81aEe34ebB508C1f);
    IFactory constant factory = IFactory(0x5F1dddbf348aC2fbe22a163e30F99F9ECE3DD50a);

    KyberElasticMultiQuoter multiQuoter;
    uint256[][] testAmounts;

    function setUp() public {
        multiQuoter = new KyberElasticMultiQuoter();

        testAmounts = new uint256[][](9);

        testAmounts[0] = new uint256[](1);
        testAmounts[0][0] = 1 ether;

        testAmounts[1] = new uint256[](1);
        testAmounts[1][0] = 1000 ether;

        testAmounts[2] = new uint256[](1);
        testAmounts[2][0] = 100000 ether;

        testAmounts[3] = new uint256[](13);
        testAmounts[4] = new uint256[](13);
        testAmounts[5] = new uint256[](13);
        for (uint256 i = 0; i < 13; ++i) {
            testAmounts[3][i] = (i + 1) * 1000 ether;
            testAmounts[4][i] = (i + 1) * 50000 ether;
            testAmounts[5][i] = (i + 1) * 100000 ether;
        }

        testAmounts[6] = new uint256[](50);
        testAmounts[7] = new uint256[](50);
        testAmounts[8] = new uint256[](50);
        for (uint256 i = 0; i < 50; ++i) {
            testAmounts[6][i] = (i + 1) * 1000 ether;
            testAmounts[7][i] = (i + 1) * 10000 ether;
            testAmounts[8][i] = (i + 1) * 50000 ether;
        }
    }

    function testKyber() public {
        address[] memory tokenPath = new address[](2);
        tokenPath[0] = ETH;
        tokenPath[1] = KNC;

        IPool[] memory poolPath = new IPool[](1);
        poolPath[0] = ETH_KNC_POOL_100_BIP;

        testAllAmountsAndPathsForSells(tokenPath, poolPath);
    }

    function testAllAmountsAndPathsForSells(address[] memory tokenPath, IPool[] memory poolPath) private {
        uint256 kyberQuoterGasUsage;
        uint256 multiQuoterGasUsage;

        bytes memory path = toPath(tokenPath, poolPath);
        bytes memory reversePath = toPath(reverseTokenPath(tokenPath), reversePoolPath(poolPath));

        console.log("Quoter Gas Comparison ");
        console.log("Token Path: ");
        for (uint256 i = 0; i < tokenPath.length; ++i) {
            console.logAddress(address(tokenPath[i]));
        }

        for (uint256 i = 0; i < testAmounts.length; ++i) {
            (kyberQuoterGasUsage, multiQuoterGasUsage) = compareQuoterSells(path, testAmounts[i]);
            console.log(
                "Normal Path: test=%d, kyberQuoterGasUsage=%d, multiQuoterGasUsage=%d",
                i + 1,
                kyberQuoterGasUsage,
                multiQuoterGasUsage
            );
            (kyberQuoterGasUsage, multiQuoterGasUsage) = compareQuoterSells(reversePath, testAmounts[i]);
            console.log(
                "Reverse Path: test=%d, kyberQuoterGasUsage=%d, multiQuoterGasUsage=%d",
                i + 1,
                kyberQuoterGasUsage,
                multiQuoterGasUsage
            );
        }
    }

    // TODO: abstract this out to reuse for all types of MultiQuoters (Uniswap, Kyber, etc.)
    function compareQuoterSells(
        bytes memory path,
        uint256[] memory amountsIn
    ) private returns (uint256 kyberQuoterGasUsage, uint256 multiQuoterGasUsage) {
        uint256 gas0 = gasleft();
        (uint256[] memory multiQuoterAmountsOut, ) = multiQuoter.quoteExactMultiInput(factory, path, amountsIn);
        uint256 gas1 = gasleft();

        for (uint256 i = 0; i < amountsIn.length; ++i) {
            try kyberQuoter.quoteExactInput(path, amountsIn[i]) returns (
                uint256 kyberQuoterAmountOut,
                uint160[] memory /* sqrtPriceX96AfterList */,
                uint32[] memory /* initializedTicksCrossedList */,
                uint256 /* gasEstimate */
            ) {
                assertLt(
                    multiQuoterAmountsOut[i],
                    kyberQuoterAmountOut + ERROR_THRESHOLD,
                    "compareQuoterSells: MultiQuoter amount is too high compared to Quoter amount"
                );
                assertGt(
                    multiQuoterAmountsOut[i],
                    kyberQuoterAmountOut - ERROR_THRESHOLD,
                    "compareQuoterSells: MultiQuoter amount is too low compared to Quoter amount"
                );
            } catch {}
        }
        return (gas1 - gasleft(), gas0 - gas1);
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

    function reverseTokenPath(address[] memory tokenPath) internal pure returns (address[] memory reversed) {
        reversed = new address[](tokenPath.length);
        for (uint256 i = 0; i < tokenPath.length; ++i) {
            reversed[i] = tokenPath[tokenPath.length - i - 1];
        }
    }

    function reversePoolPath(IPool[] memory poolPath) internal pure returns (IPool[] memory reversed) {
        reversed = new IPool[](poolPath.length);
        for (uint256 i = 0; i < poolPath.length; ++i) {
            reversed[i] = poolPath[poolPath.length - i - 1];
        }
    }
}
