import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { ObjectMap } from '../types';

export interface JsonRpcResponse {
    error: any;
    id: number;
    result: any;
}

export const utils = {
    arrayToMapWithId: <T extends object>(array: T[], idKey: keyof T): ObjectMap<T> => {
        const initialMap: ObjectMap<T> = {};
        return array.reduce((acc, val) => {
            const id = val[idKey] as any;
            acc[id] = val;
            return acc;
        }, initialMap);
    },
    /**
     * Executes JSON-RPC response validation
     * Copied from https://github.com/ethereum/web3.js/blob/79a165a205074cfdc14f59a61c41ba9ef5d25172/packages/web3-providers/src/validators/JsonRpcResponseValidator.js
     */
    isValidJsonRpcResponseOrThrow: (response: JsonRpcResponse, payload: any = undefined): boolean => {
        if (_.isObject(response)) {
            if (response.error) {
                if (response.error instanceof Error) {
                    throw new Error(`Node error: ${response.error.message}`);
                }

                throw new Error(`Node error: ${JSON.stringify(response.error)}`);
            }

            if (payload && response.id !== payload.id) {
                throw new Error(
                    `Validation error: Invalid JSON-RPC response ID (request: ${payload.id} / response: ${response.id})`,
                );
            }

            if (response.result === undefined) {
                throw new Error('Validation error: Undefined JSON-RPC result');
            }

            return true;
        }

        throw new Error('Validation error: Response should be of type Object');
    },
    chunkByByteLength: <T>(items: T[], maxByteLength: number): T[][] => {
        const itemsClone = items.slice(0);
        const chunkedItems: T[][] = [];
        let currChunk: T[] = [];
        let currentChunkTotalLength: number = 0;
        while (itemsClone.length !== 0) {
            const item = itemsClone[0];
            const currLength = Buffer.from(JSON.stringify(item)).byteLength;
            // Too big to add, reset
            if (currentChunkTotalLength + currLength > maxByteLength) {
                chunkedItems.push(currChunk);
                currChunk = [];
                currentChunkTotalLength = 0;
            } else {
                currChunk.push(item);
                currentChunkTotalLength += currLength;
                itemsClone.splice(0, 1);
            }
        }
        // Handle the final chunk
        if (currChunk.length !== 0) {
            chunkedItems.push(currChunk);
        }
        return chunkedItems;
    },
    convertAmountToBigNumber(value: string | number | BigNumber): BigNumber {
        const num = value || 0;
        const isBigNumber = BigNumber.isBigNumber(num);
        if (isBigNumber) {
            return num as BigNumber;
        }

        if (_.isString(num) && (num.indexOf('0x') === 0 || num.indexOf('-0x') === 0)) {
            return new BigNumber(num.replace('0x', ''), 16);
        }

        const baseTen = 10;
        return new BigNumber((num as number).toString(baseTen), baseTen);
    },
    encodeAmountAsHexString(value: string | number | BigNumber): string {
        const valueBigNumber = utils.convertAmountToBigNumber(value);
        const hexBase = 16;
        const valueHex = valueBigNumber.toString(hexBase);

        return valueBigNumber.isLessThan(0) ? `-0x${valueHex.substr(1)}` : `0x${valueHex}`;
    },
};
