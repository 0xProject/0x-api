pragma solidity >=0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";

import "forge-std/Test.sol";
import "../src/UniswapV3MultiQuoter.sol";
import "../src/UniswapV3Common.sol";
import "./UniswapV3GasEstimator.t.sol";

contract TestUniswapV3Sampler is Test, UniswapV3Common {
    /// @dev error threshold in wei for comparison between MultiQuoter and UniswapV3's official QuoterV2.
    /// MultiQuoter results in some rounding errors due to SqrtPriceMath library.
    uint256 constant ERROR_THRESHOLD = 125;

    IERC20TokenV06 constant DAI = IERC20TokenV06(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    IERC20TokenV06 constant FRAX = IERC20TokenV06(0x853d955aCEf822Db058eb8505911ED77F175b99e);
    IERC20TokenV06 constant RAI = IERC20TokenV06(0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919);

    IUniswapV3Pool constant DAI_FRAX_POOL_5_BIP = IUniswapV3Pool(0x97e7d56A0408570bA1a7852De36350f7713906ec);
    IUniswapV3Pool constant RAI_FRAX_POOL_30_BIP = IUniswapV3Pool(0xd3f3bf0b928551661503Ce43BC456BBdF725986a);

    IUniswapV3QuoterV2 constant uniQuoter = IUniswapV3QuoterV2(0x61fFE014bA17989E743c5F6cB21bF9697530B21e);

    IUniswapV3Factory factory;
    UniswapV3MultiQuoter multiQuoter;
    uint256[][] testAmounts;

    function setUp() public {
        multiQuoter = new UniswapV3MultiQuoter();
        factory = uniQuoter.factory();

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

    function testSingleHopQuotesForLiquidPools() public {
        IERC20TokenV06[] memory tokenPath = new IERC20TokenV06[](2);
        tokenPath[0] = DAI;
        tokenPath[1] = FRAX;

        IUniswapV3Pool[] memory poolPath = new IUniswapV3Pool[](1);
        poolPath[0] = DAI_FRAX_POOL_5_BIP;

        testAllAmountsAndPathsForBuysAndSells(tokenPath, poolPath);
    }

    function testSingleHopQuotesForIlliquidPools() public {
        IERC20TokenV06[] memory tokenPath = new IERC20TokenV06[](2);
        tokenPath[0] = RAI;
        tokenPath[1] = FRAX;

        IUniswapV3Pool[] memory poolPath = new IUniswapV3Pool[](1);
        poolPath[0] = RAI_FRAX_POOL_30_BIP;

        testAllAmountsAndPathsForBuysAndSells(tokenPath, poolPath);
    }

    function testMultiHopQuotes() public {
        IERC20TokenV06[] memory tokenPath = new IERC20TokenV06[](3);
        tokenPath[0] = DAI;
        tokenPath[1] = FRAX;
        tokenPath[2] = RAI;

        IUniswapV3Pool[] memory poolPath = new IUniswapV3Pool[](2);
        poolPath[0] = DAI_FRAX_POOL_5_BIP;
        poolPath[1] = RAI_FRAX_POOL_30_BIP;

        testAllAmountsAndPathsForBuysAndSells(tokenPath, poolPath);
    }

    function testAllAmountsAndPathsForBuysAndSells(
        IERC20TokenV06[] memory tokenPath,
        IUniswapV3Pool[] memory poolPath
    ) private {
        uint256 uniQuoterGasUsage;
        uint256 multiQuoterGasUsage;

        bytes memory path = toUniswapPath(tokenPath, poolPath);
        bytes memory reversePath = toUniswapPath(reverseTokenPath(tokenPath), reversePoolPath(poolPath));

        console.log("Quoter Gas Comparison ");
        console.log("Token Path: ");
        for (uint256 i = 0; i < tokenPath.length; ++i) {
            console.logAddress(address(tokenPath[i]));
        }

        for (uint256 i = 0; i < testAmounts.length; ++i) {
            (uniQuoterGasUsage, multiQuoterGasUsage) = compareQuoterSells(path, testAmounts[i]);
            console.log(
                "Normal Path Sell: test=%d, uniQuoterGasUsage=%d, multiQuoterGasUsage=%d",
                i + 1,
                uniQuoterGasUsage,
                multiQuoterGasUsage
            );
            (uniQuoterGasUsage, multiQuoterGasUsage) = compareQuoterSells(reversePath, testAmounts[i]);
            console.log(
                "Reverse Path Sell: test=%d, uniQuoterGasUsage=%d, multiQuoterGasUsage=%d",
                i + 1,
                uniQuoterGasUsage,
                multiQuoterGasUsage
            );
            (uniQuoterGasUsage, multiQuoterGasUsage) = compareQuoterBuys(path, testAmounts[i]);
            console.log(
                "Normal Path Buy: test=%d, uniQuoterGasUsage=%d, multiQuoterGasUsage=%d",
                i + 1,
                uniQuoterGasUsage,
                multiQuoterGasUsage
            );
            (uniQuoterGasUsage, multiQuoterGasUsage) = compareQuoterBuys(reversePath, testAmounts[i]);
            console.log(
                "Reverse Path Buy: test=%d, uniQuoterGasUsage=%d, multiQuoterGasUsage=%d",
                i + 1,
                uniQuoterGasUsage,
                multiQuoterGasUsage
            );
        }
    }

    function compareQuoterSells(
        bytes memory path,
        uint256[] memory amountsIn
    ) private returns (uint256 uniQuoterGasUsage, uint256 multiQuoterGasUsage) {
        uint256 gas0 = gasleft();
        (uint256[] memory multiQuoterAmountsOut, ) = multiQuoter.quoteExactMultiInput(factory, path, amountsIn);
        uint256 gas1 = gasleft();

        for (uint256 i = 0; i < amountsIn.length; ++i) {
            try uniQuoter.quoteExactInput(path, amountsIn[i]) returns (
                uint256 uniQuoterAmountOut,
                uint160[] memory /* sqrtPriceX96AfterList */,
                uint32[] memory /* initializedTicksCrossedList */,
                uint256 /* gasEstimate */
            ) {
                assertLt(
                    multiQuoterAmountsOut[i],
                    uniQuoterAmountOut + ERROR_THRESHOLD,
                    "compareQuoterSells: MultiQuoter amount is too high compared to UniQuoter amount"
                );
                assertGt(
                    multiQuoterAmountsOut[i],
                    uniQuoterAmountOut - ERROR_THRESHOLD,
                    "compareQuoterSells: MultiQuoter amount is too low compared to UniQuoter amount"
                );
            } catch {
                assertEq(
                    multiQuoterAmountsOut[i],
                    0,
                    "compareQuoterSells: MultiQuoter amount should be 0 when UniQuoter reverts"
                );
            }
        }
        return (gas1 - gasleft(), gas0 - gas1);
    }

    function compareQuoterBuys(
        bytes memory path,
        uint256[] memory amountsOut
    ) private returns (uint256 uniQuoterGasUsage, uint256 multiQuoterGasUsage) {
        uint256 gas0 = gasleft();
        (uint256[] memory multiQuoterAmountsIn, ) = multiQuoter.quoteExactMultiOutput(factory, path, amountsOut);
        uint256 gas1 = gasleft();

        for (uint256 i = 0; i < amountsOut.length; ++i) {
            try uniQuoter.quoteExactOutput(path, amountsOut[i]) returns (
                uint256 uniQuoterAmountIn,
                uint160[] memory /* sqrtPriceX96AfterList */,
                uint32[] memory /* initializedTicksCrossedList */,
                uint256 /* gasEstimate */
            ) {
                assertLt(
                    multiQuoterAmountsIn[i],
                    uniQuoterAmountIn + ERROR_THRESHOLD,
                    "compareQuoterBuys: MultiQuoter amount is too high compared to UniQuoter amount"
                );
                assertGt(
                    multiQuoterAmountsIn[i],
                    uniQuoterAmountIn - ERROR_THRESHOLD,
                    "compareQuoterBuys: MultiQuoter amount is too low compared to UniQuoter mamount"
                );
            } catch {
                assertEq(
                    multiQuoterAmountsIn[i],
                    0,
                    "compareQuoterBuys: MultiQuoter amount should be 0 when UniQuoter reverts"
                );
            }
        }
        return (gas1 - gasleft(), gas0 - gas1);
    }

    function testGetGasEstimateData() public {
        string memory filePath = "UniswapV3MultiQuoterGasEstimates.csv";
        string memory headers = "path,amount,isInput,ticksCrossed,mqGasEstimate,uqGasEstimate";
        vm.writeLine(filePath, headers);

        address[12] memory tokenList;
        tokenList[0] = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // USDC
        tokenList[1] = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // WETH
        tokenList[2] = 0xdAC17F958D2ee523a2206206994597C13D831ec7; // USDT
        tokenList[3] = 0x6B175474E89094C44Da98b954EedeAC495271d0F; // DAI
        tokenList[4] = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599; // WBTC
        tokenList[5] = 0xD533a949740bb3306d119CC777fa900bA034cd52; // CRV
        tokenList[6] = 0x111111111117dC0aa78b770fA6A738034120C302; // 1INCH
        tokenList[7] = 0xE41d2489571d322189246DaFA5ebDe1F4699F498; // ZRX
        tokenList[8] = 0x4d224452801ACEd8B2F0aebE155379bb5D594381; // APE
        tokenList[9] = 0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919; // RAI
        tokenList[10] = 0x3845badAde8e6dFF049820680d1F14bD3903a5d0; // SAND
        tokenList[11] = 0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0; // MATIC

        uint256[][] memory amountsList = new uint256[][](10);
        for (uint256 i = 0; i < amountsList.length; ++i) {
            amountsList[i] = new uint256[](10);
            for (uint256 j = 0; j < amountsList[i].length; ++j) {
                amountsList[i][j] = (j + 1) * 10 ** (2 * i + 4);
            }
        }

        UniswapV3GasEstimateWriter ge = new UniswapV3GasEstimateWriter();

        for (uint256 i = 0; i < tokenList.length; ++i) {
            for (uint256 j = 0; j < tokenList.length; ++j) {
                console.log("Processing i=%d, j=%d", i + 1, j + 1);
                console.log("--- %d / %d", i * tokenList.length + j + 1, tokenList.length * tokenList.length);

                if (i == j) {
                    continue;
                }

                IERC20TokenV06[] memory tokenPath = new IERC20TokenV06[](2);
                tokenPath[0] = IERC20TokenV06(tokenList[i]);
                tokenPath[1] = IERC20TokenV06(tokenList[j]);

                for (uint256 k = 0; k < amountsList.length; ++k) {
                    IUniswapV3Pool[][] memory poolPaths = getPoolPaths(
                        factory,
                        uniQuoter,
                        tokenPath,
                        amountsList[k][amountsList[k].length - 1]
                    );

                    for (uint256 l = 0; l < poolPaths.length; ++l) {
                        if (!isValidPoolPath(poolPaths[l])) {
                            continue;
                        }

                        bytes memory uniswapPath = toUniswapPath(tokenPath, poolPaths[l]);

                        try 
                            ge.writeGasEstimateDataForInput(uniswapPath, amountsList[k], filePath, uniQuoter, multiQuoter, factory)
                        {} catch {}
                        try
                            ge.writeGasEstimateDataForOutput(uniswapPath, amountsList[k], filePath, uniQuoter, multiQuoter, factory)
                        {} catch {}
                    }
                }
            }
        }
    }

    function testWarmStorage() public {
        IERC20TokenV06[] memory tokenPath = new IERC20TokenV06[](3);
        tokenPath[0] = IERC20TokenV06(0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919); // RAI
        tokenPath[1] = IERC20TokenV06(0x6B175474E89094C44Da98b954EedeAC495271d0F); // DAI
        tokenPath[2] = IERC20TokenV06(0x111111111117dC0aa78b770fA6A738034120C302); // 1INCH

        uint256 inputAmount = 228852900000000000000000;
        uint256[] memory amounts = new uint256[](13);
        for (uint256 i = 0; i < amounts.length; ++i) {
            amounts[i] = (i+1) * (inputAmount / 13);
        }

        bytes memory path = hex"03ab458634910aad20ef5f1c8ee96f1d6ac549190001f46b175474e89094c44da98b954eedeac495271d0f002710111111111117dc0aa78b770fa6a738034120c302";

        console.log("UQ Cold Read");
        for (uint256 i = 0; i < amounts.length; ++i) {
            try uniQuoter.quoteExactInput(path, amounts[i]) returns (
                uint256,
                uint160[] memory /* sqrtPriceX96AfterList */,
                uint32[] memory /* initializedTicksCrossedList */,
                uint256 uqGasEstimate
            ) {
                console.log("UQ Gas Estimates: i=%d, UQ: %d", i, uqGasEstimate);
            } catch {}
        }

        console.log("UQ Warm Read");

        for (uint256 i = 0; i < amounts.length; ++i) {
            try uniQuoter.quoteExactInput(path, amounts[i]) returns (
                uint256,
                uint160[] memory /* sqrtPriceX96AfterList */,
                uint32[] memory /* initializedTicksCrossedList */,
                uint256 uqGasEstimate
            ) {
                console.log("UQ Gas Estimates: i=%d, UQ: %d", i, uqGasEstimate);
            } catch {}
        }

        console.log("MQ Cold Read");

        {
            (, uint256[] memory mqGasEstimates) = multiQuoter.quoteExactMultiInput(factory, path, amounts);
            for (uint256 i = 0; i < amounts.length; ++i) {
                console.log("MQ Gas Estimates: i=%d, MQ: %d", i, mqGasEstimates[i]);
            }
        }
        
        console.log("MQ Warm Read");

        {
            (, uint256[] memory mqGasEstimates) = multiQuoter.quoteExactMultiInput(factory, path, amounts);
            for (uint256 i = 0; i < amounts.length; ++i) {
                console.log("MQ Gas Estimates: i=%d, MQ: %d", i, mqGasEstimates[i]);
            }
        }
    }
}
