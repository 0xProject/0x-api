pragma solidity >=0.6.5;
pragma experimental ABIEncoderV2;

import "forge-std/Test.sol";
import "../src/UniswapV3MultiQuoter.sol";

contract UniswapV3GasEstimateWriter is Test {
    function writeGasEstimateDataForInput(
        bytes memory uniswapPath,
        uint256[] memory amounts,
        string memory filePath,
        IUniswapV3QuoterV2 uniQuoter,
        IUniswapV3MultiQuoter multiQuoter,
        IUniswapV3Factory factory
    ) external {
        uint32[] memory uqTicksCrossed = new uint32[](amounts.length);
        uint256[] memory uqInputGasEst = new uint256[](amounts.length);

        for(uint256 i = 0; i < amounts.length; ++i) {
            try uniQuoter.quoteExactInput{gas: 700e3}(uniswapPath, amounts[i]) returns (
                uint256,
                uint160[] memory,
                uint32[] memory ticksCrossed,
                uint256 gasEstimate
            ) {
                uqTicksCrossed[i] = ticksCrossed[0];
                uqInputGasEst[i] = gasEstimate;
            } catch {}
        }

        (, uint256[] memory mqInputGasEst) = multiQuoter.quoteExactMultiInput(factory, uniswapPath, amounts);

        for (uint256 i = 0; i < amounts.length; ++i) {
            if (mqInputGasEst[i] == 0 || uqInputGasEst[i] == 0) {
                continue;
            }
            string memory pathStr = toHexString(uniswapPath);
            string memory amountStr = toHexString(abi.encodePacked(amounts[i]));
            string memory ticksCrossedStr = toHexString(abi.encodePacked(uqTicksCrossed[i]));
            string memory mqGasEstimateStr = toHexString(abi.encodePacked(mqInputGasEst[i]));
            string memory uqGasEstimateStr = toHexString(abi.encodePacked(uqInputGasEst[i]));
            string memory row = string(
                abi.encodePacked(
                    pathStr,
                    ",",
                    amountStr,
                    ",",
                    "TRUE",
                    ",",
                    ticksCrossedStr,
                    ",",
                    mqGasEstimateStr,
                    ",",
                    uqGasEstimateStr
                )
            );
            vm.writeLine(filePath, row);
        }
        revert();
    }

    function writeGasEstimateDataForOutput(
        bytes memory uniswapPath,
        uint256[] memory amounts,
        string memory filePath,
        IUniswapV3QuoterV2 uniQuoter,
        IUniswapV3MultiQuoter multiQuoter,
        IUniswapV3Factory factory
    ) external {
        uint32[] memory uqTicksCrossed = new uint32[](amounts.length);
        uint256[] memory uqOutputGasEst = new uint256[](amounts.length);

        for(uint256 i = 0; i < amounts.length; ++i) {
            try uniQuoter.quoteExactOutput{gas: 700e3}(uniswapPath, amounts[i]) returns (
                uint256,
                uint160[] memory,
                uint32[] memory ticksCrossed,
                uint256 gasEstimate
            ) {
                uqTicksCrossed[i] = ticksCrossed[0];
                uqOutputGasEst[i] = gasEstimate;
            } catch {}
        }

        (, uint256[] memory mqOutputGasEst) = multiQuoter.quoteExactMultiOutput(factory, uniswapPath, amounts);

        for (uint256 i = 0; i < amounts.length; ++i) {
            if (mqOutputGasEst[i] == 0 || uqOutputGasEst[i] == 0) {
                continue;
            }
            string memory pathStr = toHexString(uniswapPath);
            string memory amountStr = toHexString(abi.encodePacked(amounts[i]));
            string memory ticksCrossedStr = toHexString(abi.encodePacked(uqTicksCrossed[i]));
            string memory mqGasEstimateStr = toHexString(abi.encodePacked(mqOutputGasEst[i]));
            string memory uqGasEstimateStr = toHexString(abi.encodePacked(uqOutputGasEst[i]));
            string memory row = string(
                abi.encodePacked(
                    pathStr,
                    ",",
                    amountStr,
                    ",",
                    "FALSE",
                    ",",
                    ticksCrossedStr,
                    ",",
                    mqGasEstimateStr,
                    ",",
                    uqGasEstimateStr
                )
            );
            vm.writeLine(filePath, row);
        }
        revert();
    }

    function toHexString(bytes memory buffer) private pure returns (string memory) {
        // Fixed buffer size for hexadecimal convertion
        bytes memory converted = new bytes(buffer.length * 2);

        bytes memory _base = "0123456789abcdef";

        for (uint256 i = 0; i < buffer.length; i++) {
            converted[i * 2] = _base[uint8(buffer[i]) / _base.length];
            converted[i * 2 + 1] = _base[uint8(buffer[i]) % _base.length];
        }

        return string(abi.encodePacked("0x", converted));
    }
}