"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const rax = require("retry-axios");
const retryableAxiosInstance = axios_1.default.create();
// Attach retry-axios only to our specific instance
rax.attach(retryableAxiosInstance);
//# sourceMappingURL=axios_utils.js.map