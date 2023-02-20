"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaiSetup = void 0;
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const ChaiBigNumber = require("chai-bignumber");
const dirtyChai = require("dirty-chai");
exports.chaiSetup = {
    configure() {
        chai.config.includeStack = true;
        chai.use(ChaiBigNumber());
        chai.use(dirtyChai);
        chai.use(chaiAsPromised);
    },
};
//# sourceMappingURL=chai_setup.js.map