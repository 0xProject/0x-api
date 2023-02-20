"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootHandler = void 0;
const rootHandler = (_req, res) => {
    res.send({
        message: 'This is the root of the 0x API. Visit https://0x.org/docs/api for documentation.',
    });
};
exports.rootHandler = rootHandler;
//# sourceMappingURL=root_handler.js.map