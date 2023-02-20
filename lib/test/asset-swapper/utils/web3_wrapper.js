"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.web3Wrapper = exports.provider = void 0;
const dev_utils_1 = require("@0x/dev-utils");
const web3_wrapper_1 = require("@0x/web3-wrapper");
const provider = dev_utils_1.web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
exports.provider = provider;
const web3Wrapper = new web3_wrapper_1.Web3Wrapper(provider);
exports.web3Wrapper = web3Wrapper;
//# sourceMappingURL=web3_wrapper.js.map