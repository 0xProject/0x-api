import { assert } from '@0x/assert';
import { Callback, ErrorCallback, Subprovider } from '@0x/subproviders';
import { logUtils } from '@0x/utils';
import { fetchAsync } from '@0x/utils';
import { JSONRPCRequestPayload } from 'ethereum-types';

import { InternalServerError } from './errors';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It forwards on JSON RPC requests to the supplied `rpcUrl` endpoint
 */
export class RPCSubprovider extends Subprovider {
    private readonly _rpcUrls: string[];
    private readonly _requestTimeoutMs: number;
    /**
     * @param rpcUrl URL to the backing Ethereum node to which JSON RPC requests should be sent
     * @param requestTimeoutMs Amount of miliseconds to wait before timing out the JSON RPC request
     */
    constructor(rpcUrls: string[], requestTimeoutMs: number = 20000) {
        super();
        rpcUrls.forEach(r => assert.isString('rpcUrl', r));
        assert.isNumber('requestTimeoutMs', requestTimeoutMs);
        this._rpcUrls = rpcUrls;
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
        let response: Response;
        try {
            response = await this._fetchResponseAsync(this._rpcUrls, payload);
        } catch (err) {
            end(err);
            return;
        }

        if (!response.ok) {
            const msg = `RPCSubprovider: ${response.status} ${response.statusText}`;
            return end(new InternalServerError(msg));
        }

        let data;
        try {
            data = JSON.parse(await response.text());
        } catch (err) {
            end(err);
            return;
        }

        if (data.error) {
            end(data.error);
            return;
        }
        end(null, data.result);
    }

    /**
     * Attempts each RPC url one by one until a parsable response is returned.
     * Attempts the next provider on a 429 or network error.
     * @param rpcUrls
     * @param payload
     */
    private async _fetchResponseAsync(rpcUrls: string[], payload: JSONRPCRequestPayload): Promise<Response> {
        const finalPayload = Subprovider._createFinalPayload(payload);
        const headers = new Headers({
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            Connection: 'keep-alive',
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(finalPayload);

        let response: Response | undefined;
        let error: Error | undefined;
        for (const rpcUrl of rpcUrls) {
            try {
                response = await fetchAsync(
                    rpcUrl,
                    {
                        method: 'POST',
                        headers,
                        body,
                        keepalive: true,
                    },
                    this._requestTimeoutMs,
                );
                switch (response.status) {
                    case 429: // Rate limited
                    case 502: // Bad Gateway
                    case 503: // Service Unavailable
                        logUtils.log(`RPCSubprovider failure on ${rpcUrl}`);
                        continue;
                    default:
                        break;
                }
            } catch (err) {
                error = err;
                logUtils.log(`RPCSubprovider failure on ${rpcUrl} ${err.message}`);
            }
        }

        if (!response) {
            const err = error || new InternalServerError('RPCSubprovider exhausted all RPC urls');
            throw err;
        }
        return response;
    }
}
