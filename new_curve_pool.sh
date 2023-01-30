#!/bin/bash

__USAGE="./new_curve_pool.sh POOL_NAME POOL_ADDRESS POOL_GAS TOKEN_ONE TOKEN_TWO"

POOL_NAME=$1
POOL_ADDRESS=$2
POOL_GAS=$3
TOKEN_ONE=$4
TOKEN_TWO=$5
 
if [ -z "$TOKEN_TWO" ]; then
        echo "Please make sure to provide the correct number of arguments"
	echo $__USAGE
        exit 1
fi 

sed -I "" "s/\/\/ NEW CURVE POOL ADDRESSES HERE/${POOL_NAME}: '${POOL_ADDRESS}',\n    \/\/ NEW CURVE POOL ADDRESSES HERE/" src/asset-swapper/utils/market_operation_utils/constants.ts

POOL_INFO="[CURVE_POOLS.${POOL_NAME}]: createCurveExchangePool({ \\
        tokens: [MAINNET_TOKENS.${TOKEN_ONE}, MAINNET_TOKENS.${TOKEN_TWO}\], \\
        pool: CURVE_POOLS.${POOL_NAME}, \\
        gasSchedule: ${POOL_GAS}, \\
    }), \\
"

sed -I "" "s/\/\/ NEW CURVE POOL INFO HERE/${POOL_INFO}    \/\/ NEW CURVE POOL INFO HERE/" src/asset-swapper/utils/market_operation_utils/constants.ts


