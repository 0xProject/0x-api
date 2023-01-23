// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.9;

import {IPool} from '../../interfaces/IPool.sol';

library PoolTicksCounter {
  function countInitializedTicksCrossed(
    IPool self,
    int24 nearestCurrentTickBefore,
    int24 nearestCurrentTickAfter
  ) internal view returns (uint32 initializedTicksCrossed) {
    initializedTicksCrossed = 0;
    (int24 tickLower, int24 tickUpper) = (nearestCurrentTickBefore < nearestCurrentTickAfter)
      ? (nearestCurrentTickBefore, nearestCurrentTickAfter)
      : (nearestCurrentTickAfter, nearestCurrentTickBefore);
    while (tickLower != tickUpper) {
      initializedTicksCrossed++;
      (, tickLower) = self.initializedTicks(tickLower);
    }
  }
}
