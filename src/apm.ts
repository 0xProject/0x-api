// tslint:disable

import * as apm from 'elastic-apm-node';
apm.start({ active: process.env.ELASTIC_APM_ACTIVE === 'true' });

const wrapper = function (orig: any, name: any) {
    return function wrapped(...args: any[]) {
        var span = apm.startSpan(name);
        // @ts-ignore
        const result = orig.apply(this, args);
        if (result && result.then) {
            return new Promise((resolve, reject) => {
                result
                    .then((re: any) => {
                        span && span.end();
                        resolve(re);
                    })
                    .catch((err: Error) => {
                        span && span.end();
                        reject(err);
                    });
            });
        }
        span && span.end();
        return result;
    };
};

var shimmer = require('elastic-apm-node/lib/instrumentation/shimmer');
var SassySampler = require('@0x/asset-swapper/lib/src/network/sassy_sampler').SassySampler;
var LiveChain = require('@0x/asset-swapper/lib/src/network/chain').LiveChain;
var QuoteRequestor = require('@0x/asset-swapper/lib/src/utils/quote_requestor').QuoteRequestor;
var MarketOperationUtils = require('@0x/asset-swapper/lib/src/utils/market_operation_utils/index').MarketOperationUtils;
var quoteReporter = require('@0x/asset-swapper/lib/src/utils/quote_report_generator');
var pathOptimizer = require('@0x/asset-swapper/lib/src/utils/market_operation_utils/path_optimizer');

shimmer.wrap(QuoteRequestor.prototype, 'requestRfqtFirmQuotesAsync', wrapper);
shimmer.wrap(QuoteRequestor.prototype, 'requestRfqtIndicativeQuotesAsync', wrapper);
shimmer.wrap(SassySampler.prototype, 'getSellSamplesAsync', wrapper);
shimmer.wrap(SassySampler.prototype, 'getTwoHopSellSamplesAsync', wrapper);
shimmer.wrap(MarketOperationUtils.prototype, '_generateOptimizedOrdersAsync', wrapper);
shimmer.wrap(MarketOperationUtils.prototype, 'getMarketSellLiquidityAsync', wrapper);
shimmer.wrap(LiveChain.prototype, '_executeAsync', wrapper);
shimmer.wrap(quoteReporter, 'generateQuoteReport', wrapper);
shimmer.wrap(pathOptimizer, 'findOptimalPathAsync', wrapper);

// tslint:enable
