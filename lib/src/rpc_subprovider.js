"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCSubprovider = void 0;
const assert_1 = require("@0x/assert");
const subproviders_1 = require("@0x/subproviders");
const types_1 = require("@0x/types");
const http = require("http");
const https = require("https");
const JsonRpcError = require("json-rpc-error");
const node_fetch_1 = require("node-fetch");
const prom_client_1 = require("prom-client");
const zlib_1 = require("zlib");
const config_1 = require("./config");
const constants_1 = require("./constants");
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: fix me!
const agent = (_parsedURL) => (_parsedURL.protocol === 'http:' ? httpAgent : httpsAgent);
const ETH_RPC_RESPONSE_TIME = new prom_client_1.Histogram({
    name: 'eth_rpc_response_duration_seconds',
    help: 'The response time of an RPC request',
    labelNames: ['method'],
    buckets: config_1.PROMETHEUS_REQUEST_BUCKETS,
});
const ETH_RPC_RESPONSE_SIZE = new prom_client_1.Histogram({
    name: 'eth_rpc_reponse_size_bytes',
    help: 'The rpc response size',
    labelNames: ['method', 'status'],
    buckets: config_1.PROMETHEUS_RESPONSE_SIZE_BUCKETS,
});
const ETH_RPC_REQUEST_SIZE = new prom_client_1.Histogram({
    name: 'eth_rpc_request_size_bytes',
    help: 'The rpc request payload size',
    labelNames: ['method'],
    buckets: config_1.PROMETHEUS_REQUEST_SIZE_BUCKETS,
});
const ETH_RPC_REQUESTS = new prom_client_1.Counter({
    name: 'eth_rpc_requests_total',
    help: 'The count of RPC requests',
    labelNames: ['method', 'status'],
});
/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It forwards on JSON RPC requests to the supplied `rpcUrl` endpoint
 */
class RPCSubprovider extends subproviders_1.Subprovider {
    /**
     * @param rpcUrl URL to the backing Ethereum node to which JSON RPC requests should be sent
     * @param requestTimeoutMs Amount of miliseconds to wait before timing out the JSON RPC request
     * @param shouldCompressRequest Whether the request body should be compressed (gzip) and the content encoding set to gzip
     */
    constructor(rpcUrl, requestTimeoutMs, shouldCompressRequest) {
        super();
        this._rpcUrls = Array.isArray(rpcUrl) ? rpcUrl : [rpcUrl];
        this._rpcUrls.forEach((url) => assert_1.assert.isString('rpcUrl', url));
        assert_1.assert.isNumber('requestTimeoutMs', requestTimeoutMs);
        this._requestTimeoutMs = requestTimeoutMs;
        this._shouldCompressRequest = shouldCompressRequest;
    }
    /**
     * This method conforms to the web3-provider-engine interface.
     * It is called internally by the ProviderEngine when it is this subproviders
     * turn to handle a JSON RPC request.
     * @param payload JSON RPC payload
     * @param _next Callback to call if this subprovider decides not to handle the request
     * @param end Callback to call if subprovider handled the request and wants to pass back the request.
     */
    async handleRequest(payload, _next, end) {
        var _a;
        const finalPayload = subproviders_1.Subprovider._createFinalPayload(payload);
        const headers = new node_fetch_1.Headers({
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            Connection: 'keep-alive',
            'Content-Type': 'application/json',
            ...(this._shouldCompressRequest ? { 'Content-Encoding': 'gzip' } : {}),
        });
        const method = (_a = finalPayload.method) !== null && _a !== void 0 ? _a : 'method:unknown';
        const begin = Date.now();
        let response;
        const rpcUrl = this._rpcUrls[Math.floor(Math.random() * this._rpcUrls.length)];
        const body = await this._encodeRequestPayloadAsync(finalPayload);
        ETH_RPC_REQUEST_SIZE.labels(method).observe(Buffer.byteLength(body, 'utf8'));
        try {
            response = await (0, node_fetch_1.default)(rpcUrl, {
                method: 'POST',
                headers,
                body,
                timeout: this._requestTimeoutMs,
                compress: true,
                agent,
            });
        }
        catch (err) {
            ETH_RPC_REQUESTS.labels(method, config_1.PROMETHEUS_LABEL_STATUS_ERROR).inc();
            end(new JsonRpcError.InternalError(err));
            return;
        }
        finally {
            const duration = (Date.now() - begin) / constants_1.ONE_SECOND_MS;
            ETH_RPC_RESPONSE_TIME.labels(method).observe(duration);
        }
        const text = await response.text();
        if (!response.ok) {
            ETH_RPC_REQUESTS.labels(method, config_1.PROMETHEUS_LABEL_STATUS_ERROR).inc();
            ETH_RPC_RESPONSE_SIZE.labels(method, config_1.PROMETHEUS_LABEL_STATUS_ERROR).observe(text.length);
            const statusCode = response.status;
            switch (statusCode) {
                case types_1.StatusCodes.MethodNotAllowed:
                    end(new JsonRpcError.MethodNotFound());
                    return;
                case types_1.StatusCodes.GatewayTimeout: {
                    const errMsg = 'Gateway timeout. The request took too long to process. This can happen when querying logs over too wide a block range.';
                    const err = new Error(errMsg);
                    end(new JsonRpcError.InternalError(err));
                    return;
                }
                default:
                    end(new JsonRpcError.InternalError(text));
                    return;
            }
        }
        ETH_RPC_RESPONSE_SIZE.labels(method, config_1.PROMETHEUS_LABEL_STATUS_OK).observe(text.length);
        let data;
        try {
            data = JSON.parse(text);
        }
        catch (err) {
            ETH_RPC_REQUESTS.labels(method, config_1.PROMETHEUS_LABEL_STATUS_ERROR).inc();
            end(new JsonRpcError.InternalError(err));
            return;
        }
        if (data.error) {
            ETH_RPC_REQUESTS.labels(method, config_1.PROMETHEUS_LABEL_STATUS_ERROR).inc();
            end(data.error);
            return;
        }
        ETH_RPC_REQUESTS.labels(method, config_1.PROMETHEUS_LABEL_STATUS_OK).inc();
        end(null, data.result);
    }
    async _encodeRequestPayloadAsync(finalPayload) {
        const body = Buffer.from(JSON.stringify(finalPayload));
        if (!this._shouldCompressRequest) {
            return body;
        }
        return new Promise((resolve, reject) => {
            (0, zlib_1.gzip)(body, (err, result) => {
                err ? reject(err) : resolve(result);
            });
        });
    }
}
exports.RPCSubprovider = RPCSubprovider;
//# sourceMappingURL=rpc_subprovider.js.map