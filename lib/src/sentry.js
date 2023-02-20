"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentryInit = void 0;
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const constants_1 = require("./constants");
/**
 * Creates configuration for sentry.io.
 */
function SentryInit(options) {
    Sentry.init({
        dsn: options.dsn,
        environment: options.environment,
        sampleRate: options.sampleRate,
        integrations: [
            new Sentry.Integrations.Http({
                tracing: true,
            }),
            new Tracing.Integrations.Express({
                app: options.app,
            }),
        ],
        // TODO
        // This naive whitelisting should be removed after we apply whitelisting
        // on the ingress controller side.
        //
        tracesSampler: (context) => {
            var _a, _b;
            // Do not trace health check endpoint.
            //
            if ((_a = context === null || context === void 0 ? void 0 : context.transactionContext) === null || _a === void 0 ? void 0 : _a.name.includes(constants_1.HEALTHCHECK_PATH)) {
                return 0;
            }
            for (const path of options.paths) {
                if ((_b = context === null || context === void 0 ? void 0 : context.transactionContext) === null || _b === void 0 ? void 0 : _b.name.includes(path)) {
                    return options.tracesSampleRate;
                }
            }
            return 0;
        },
    });
    options.app.use(Sentry.Handlers.requestHandler());
    options.app.use(Sentry.Handlers.tracingHandler());
}
exports.SentryInit = SentryInit;
//# sourceMappingURL=sentry.js.map