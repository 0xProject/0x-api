import { assert } from '@0x/assert';
import { Callback, ErrorCallback, Subprovider } from '@0x/subproviders';
import { StatusCodes } from '@0x/types';
import Axios, { AxiosInstance, AxiosResponse } from 'axios';
import { JSONRPCRequestPayload } from 'ethereum-types';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import JsonRpcError = require('json-rpc-error');

import { ONE_SECOND_MS } from './constants';

// tslint:disable-next-line: custom-no-magic-numbers
const KEEP_ALIVE_TTL = 5 * 60 * ONE_SECOND_MS;

const httpAgent = new HttpAgent({
    keepAlive: true,
    timeout: KEEP_ALIVE_TTL,
});
const httpsAgent = new HttpsAgent({
    keepAlive: true,
    timeout: KEEP_ALIVE_TTL,
});
export const httpRequestorHttpClient: AxiosInstance = Axios.create({
    httpAgent,
    httpsAgent,
});

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It forwards on JSON RPC requests to the supplied `rpcUrl` endpoint
 */
export class RPCSubprovider extends Subprovider {
    private readonly _rpcUrl: string;
    private readonly _requestTimeoutMs: number;
    /**
     * @param rpcUrl URL to the backing Ethereum node to which JSON RPC requests should be sent
     * @param requestTimeoutMs Amount of miliseconds to wait before timing out the JSON RPC request
     */
    constructor(rpcUrl: string, requestTimeoutMs: number = 20000) {
        super();
        assert.isString('rpcUrl', rpcUrl);
        assert.isNumber('requestTimeoutMs', requestTimeoutMs);
        this._rpcUrl = rpcUrl;
        this._requestTimeoutMs = requestTimeoutMs;
    }
    /**
     * This method conforms to the web3-provider-engine interface.
     * It is called internally by the ProviderEngine when it is this subproviders
     * turn to handle a JSON RPC request.
     * @param payload JSON RPC payload
     * @param _next Callback to call if this subprovider decides not to handle the request
     * @param end Callback to call if subprovider handled the request and wants to pass back the request.
     */
    // tslint:disable-next-line:prefer-function-over-method async-suffix
    public async handleRequest(payload: JSONRPCRequestPayload, _next: Callback, end: ErrorCallback): Promise<void> {
        const finalPayload = Subprovider._createFinalPayload(payload);
        const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip,compress,deflate',
        };

        let response: AxiosResponse;
        try {
            const id = `rpc-${payload.id}-${payload.method}-${payload.params[0]}`;
            if (payload.params && payload.params[0] && payload.params[0].to) {
                const { to } = payload.params[0] as any;
                console.log({ to });
            }
            console.time(id);
            response = await httpRequestorHttpClient.post(this._rpcUrl, finalPayload, {
                headers,
                timeout: this._requestTimeoutMs,
            });
            console.log(response.request.headers);
            console.log(response.headers);
            console.timeEnd(id);
            // response = await fetchAsync(
            //    this._rpcUrl,
            //    {
            //        method: 'POST',
            //        headers,
            //        body: JSON.stringify(finalPayload),
            //        keepalive: true,
            //        compress: true,
            //    } as any,
            //    this._requestTimeoutMs,
            // );
        } catch (err) {
            end(new JsonRpcError.InternalError(err));
            return;
        }

        const text = response.data;
        if (response.status !== StatusCodes.Success) {
            const statusCode = response.status;
            switch (statusCode) {
                case StatusCodes.MethodNotAllowed:
                    end(new JsonRpcError.MethodNotFound());
                    return;
                case StatusCodes.GatewayTimeout:
                    const errMsg =
                        'Gateway timeout. The request took too long to process. This can happen when querying logs over too wide a block range.';
                    const err = new Error(errMsg);
                    end(new JsonRpcError.InternalError(err));
                    return;
                default:
                    end(new JsonRpcError.InternalError(text));
                    return;
            }
        }

        const data = response.data;
        if (data.error) {
            end(data.error);
            return;
        }
        end(null, data.result);
    }
}
