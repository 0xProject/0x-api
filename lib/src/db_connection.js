"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDBConnectionOrThrow = exports.getDBConnection = void 0;
const typeorm_1 = require("typeorm");
const ormconfig_1 = require("./ormconfig");
let connection;
async function getDBConnection() {
    if (connection !== undefined) {
        return connection;
    }
    if (ormconfig_1.default === undefined) {
        return undefined;
    }
    connection = await (0, typeorm_1.createConnection)(ormconfig_1.default);
    return connection;
}
exports.getDBConnection = getDBConnection;
async function getDBConnectionOrThrow() {
    const connection = await getDBConnection();
    if (connection === undefined) {
        throw new Error('Could not get a DB connection');
    }
    return connection;
}
exports.getDBConnectionOrThrow = getDBConnectionOrThrow;
//# sourceMappingURL=db_connection.js.map