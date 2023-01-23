// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.9;

/// @title Validate if the transaction is still valid
abstract contract DeadlineValidation {
  modifier onlyNotExpired(uint256 deadline) {
    require(_blockTimestamp() <= deadline, 'Expired');
    _;
  }

  /// @dev Override this function to test easier with block timestamp
  function _blockTimestamp() internal view virtual returns (uint256) {
    return block.timestamp;
  }
}
