"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDBConnectionAsync = void 0;
const db_connection_1 = require("../../src/db_connection");
/**
 * Get the DB connection and initialize it by installing extension and synchronize schemas
 * @returns db connection
 */
async function initDBConnectionAsync() {
    const connection = await (0, db_connection_1.getDBConnectionOrThrow)();
    await connection.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`); // used by view `rfq_maker_pairs_update_time_hashes`
    await connection.synchronize(true);
    return connection;
}
exports.initDBConnectionAsync = initDBConnectionAsync;
//# sourceMappingURL=db_connection.js.map