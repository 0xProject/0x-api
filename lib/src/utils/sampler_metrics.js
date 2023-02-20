"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAMPLER_METRICS = void 0;
const prom_client_1 = require("prom-client");
const SAMPLER_GAS_USED_SUMMARY = new prom_client_1.Summary({
    name: 'sampler_gas_used_summary',
    help: 'Provides information about the gas used during a sampler call',
    labelNames: ['side'],
});
const SAMPLER_GAS_LIMIT_SUMMARY = new prom_client_1.Summary({
    name: 'sampler_gas_limit_summary',
    help: 'Provides information about the gas limit detected during a sampler call',
});
const SAMPLER_BLOCK_NUMBER_GAUGE = new prom_client_1.Gauge({
    name: 'sampler_blocknumber',
    help: 'Provides information about the gas limit detected during a sampler call',
});
const ROUTER_EXECUTION_TIME_SUMMARY = new prom_client_1.Summary({
    name: 'router_execution_time',
    help: 'Provides information about the execution time for routing related logic',
    labelNames: ['router', 'type'],
});
exports.SAMPLER_METRICS = {
    /**
     * Logs the gas information performed during a sampler call.
     *
     * @param side The market side
     * @param gasLimit The gas limit (gas remaining measured before any operations have been performed)
     * @param gasLeft The gas remaining measured after all operations have been performed
     */
    logGasDetails: ({ side, gasLimit, gasUsed, }) => {
        SAMPLER_GAS_USED_SUMMARY.observe({ side }, gasUsed.toNumber());
        SAMPLER_GAS_LIMIT_SUMMARY.observe(gasLimit.toNumber());
    },
    /**
     * Logs the block number
     *
     * @param blockNumber block number of the sampler call
     */
    logBlockNumber: (blockNumber) => {
        SAMPLER_BLOCK_NUMBER_GAUGE.set(blockNumber.toNumber());
    },
    /**
     * Logs the routing timings
     *
     * @param data.router The router type (neon-router or js)
     * @param data.type The type of timing being recorded (e.g total timing, all sources timing or vip timing)
     * @param data.timingMs The timing in milliseconds
     */
    logRouterDetails: (data) => {
        const { router, type, timingMs } = data;
        ROUTER_EXECUTION_TIME_SUMMARY.observe({ router, type }, timingMs);
    },
};
//# sourceMappingURL=sampler_metrics.js.map