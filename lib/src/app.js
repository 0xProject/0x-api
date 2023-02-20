"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppAsync = void 0;
const express = require("express");
const http_service_runner_1 = require("./runners/http_service_runner");
/*
 * starts the app with dependencies injected. This entry-point is used when running a single instance 0x API
 * deployment and in tests. It is not used in production deployments where scaling is required.
 * @param dependencies  all values are optional and will be filled with reasonable defaults.
 * @return the app object
 */
async function getAppAsync(dependencies, config) {
    const app = express();
    const { server } = await (0, http_service_runner_1.runHttpServiceAsync)(dependencies, config, app);
    server.on('close', async () => {
        // Register a shutdown event listener.
        // TODO: More teardown logic should be added here. For example individual services should be torn down.
    });
    return { app, server };
}
exports.getAppAsync = getAppAsync;
//# sourceMappingURL=app.js.map