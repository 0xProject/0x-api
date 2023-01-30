#!/bin/bash

__USAGE="./new_curve_pool.sh POOL_NAME POOL_ADDRESS POOL_GAS TOKEN_ONE TOKEN_TWO"

POOL_NAME=pool_name
POOL_ADDRESS=0x0000
POOL_GAS=123
TOKEN_ONE=USDC
TOKEN_TWO=WETH
 
#if [ -z "$NUM_SAMPLES" ]; then
#        echo "You must provide NUM_SAMPLES"
#        exit 1
#fi 



sed -I "" "s/\/\/ NEW CURVE POOL ADDRESSES HERE/${POOL_NAME}: '${POOL_ADDRESS}',\n    \/\/ NEW CURVE POOL ADDRESSES HERE\n/" src/asset-swapper/utils/market_operation_utils/constants.ts


POOL_INFO=' \
    [CURVE_POOLS.${POOL_NAME}]: createCurveExchangePool({ \
        tokens: [MAINNET_TOKENS.${TOKEN_ONE}, MAINNET_TOKENS.${TOKEN_TWO}\], \
        pool: CURVE_POOLS.${POOL_NAME}, \
        gasSchedule: ${POOL_GAS}, \
    }), \
'


sed -I "" "s/\/\/ NEW CURVE POOL INFO HERE/${POOL_INFO}    \/\/ NEW CURVE POOL INFO HERE/" src/asset-swapper/utils/market_operation_utils/constants.ts


