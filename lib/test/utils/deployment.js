"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardownDependenciesAsync = exports.setupDependenciesAsync = void 0;
const utils_1 = require("@0x/utils");
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
const db_connection_1 = require("./db_connection");
// depends on a `docker-compose-test.yml` existing in the api root directory
const apiRootDir = path.normalize(path.resolve(`${__dirname}/../../../`));
const dockerComposeFilename = 'docker-compose-test.yml';
var LogType;
(function (LogType) {
    LogType[LogType["Console"] = 0] = "Console";
    LogType[LogType["File"] = 1] = "File";
})(LogType || (LogType = {}));
let didTearDown = false;
/**
 * Sets up 0x-api's dependencies.
 * @param suiteName The name of the test suite that is using this function. This
 *        helps to make the logs more intelligible.
 * @param logType Indicates where logs should be directed.
 */
async function setupDependenciesAsync(suiteName, logType) {
    // Tear down any existing dependencies or lingering data if a tear-down has
    // not been called yet.
    if (!didTearDown) {
        await teardownDependenciesAsync(suiteName, logType);
    }
    // Spin up the 0x-api dependencies
    const up = (0, child_process_1.spawn)('docker-compose', ['-f', dockerComposeFilename, 'up'], {
        cwd: apiRootDir,
    });
    directLogs(up, suiteName, 'up', logType);
    didTearDown = false;
    // Wait for the dependencies to boot up.
    await waitForDependencyStartupAsync(up);
    await sleepAsync(10);
    await confirmPostgresConnectivityAsync();
}
exports.setupDependenciesAsync = setupDependenciesAsync;
/**
 * Tears down 0x-api's dependencies.
 * @param suiteName The name of the test suite that is using this function. This
 *        helps to make the logs more intelligible.
 * @param logType Indicates where logs should be directed.
 */
async function teardownDependenciesAsync(suiteName, logType) {
    // Tear down any existing docker containers from the `docker-compose-test.yml` file.
    const down = (0, child_process_1.spawn)('docker-compose', ['-f', dockerComposeFilename, 'down'], {
        cwd: apiRootDir,
    });
    directLogs(down, suiteName, 'down', logType);
    const timeout = 20000;
    await waitForCloseAsync(down, 'down', timeout);
    didTearDown = true;
}
exports.teardownDependenciesAsync = teardownDependenciesAsync;
function directLogs(stream, suiteName, command, logType) {
    if (logType === LogType.Console) {
        stream.stdout.on('data', (chunk) => {
            neatlyPrintChunk(`[${suiteName}-${command}]`, chunk);
        });
        stream.stderr.on('data', (chunk) => {
            neatlyPrintChunk(`[${suiteName}-${command} | error]`, chunk);
        });
    }
    else if (logType === LogType.File) {
        const logStream = fs.createWriteStream(`${apiRootDir}/${suiteName}_${command}_logs`, { flags: 'a' });
        const errorStream = fs.createWriteStream(`${apiRootDir}/${suiteName}_${command}_errors`, { flags: 'a' });
        stream.stdout.pipe(logStream);
        stream.stderr.pipe(errorStream);
    }
}
function neatlyPrintChunk(prefix, chunk) {
    const data = chunk.toString().split('\n');
    data.filter((datum) => datum !== '').map((datum) => {
        utils_1.logUtils.log(prefix, datum.trim());
    });
}
async function waitForCloseAsync(stream, command, timeout) {
    return new Promise((resolve, reject) => {
        stream.on('close', () => {
            resolve();
        });
        if (timeout !== undefined) {
            setTimeout(() => {
                reject(new Error(`Timed out waiting for "${command}" to close`));
            }, timeout);
        }
    });
}
async function waitForDependencyStartupAsync(logStream) {
    return new Promise((resolve, reject) => {
        logStream.stdout.on('data', (chunk) => {
            const data = chunk.toString().split('\n');
            for (const datum of data) {
                if (/.*postgres.*PostgreSQL init process complete; ready for start up./.test(datum)) {
                    resolve();
                    return;
                }
            }
        });
        setTimeout(() => {
            reject(new Error('Timed out waiting for dependency logs'));
        }, 60000);
    });
}
async function confirmPostgresConnectivityAsync(maxTries = 5) {
    try {
        await Promise.all([
            // delay before retrying
            new Promise((resolve) => setTimeout(resolve, 2000)),
            async () => {
                await (0, db_connection_1.initDBConnectionAsync)();
            },
        ]);
        return;
    }
    catch (e) {
        if (maxTries > 0) {
            await confirmPostgresConnectivityAsync(maxTries - 1);
        }
        else {
            throw e;
        }
    }
}
async function sleepAsync(timeSeconds) {
    return new Promise((resolve) => {
        const secondsPerMillisecond = 1000;
        setTimeout(resolve, timeSeconds * secondsPerMillisecond);
    });
}
//# sourceMappingURL=deployment.js.map