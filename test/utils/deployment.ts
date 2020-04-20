import { logUtils as log } from '@0x/utils';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { promisify } from 'util';

const apiRootDir = path.normalize(path.resolve(`${__dirname}/../../../`));
const rimrafAsync = promisify(rimraf);

let yarnStartProcess: ChildProcessWithoutNullStreams;

/**
 * The configuration object that provides information on how verbose the logs
 * should be.
 * @param shouldPrintApiLogs Whether or not the 0x-api logs should be surfaced.
 * @param shouldPrintDependencyLogs Whether or not the 0x-api's dependencies
 *        should surface their logs.
 * TODO(jalextowle): It would be a good improvement to be able to specify log
 * files where the logs should actually be written.
 */
export interface LoggingConfig {
    shouldPrintApiLogs?: boolean;
    shouldPrintDependencyLogs?: boolean;
}

/**
 * Sets up a 0x-api instance.
 * @param logConfig Whether or not the logs from the setup functions should
 *        be printed.
 */
export async function setupApiAsync(logConfig: LoggingConfig = {}): Promise<void> {
    if (yarnStartProcess) {
        throw new Error('Old 0x-api instance has not been torn down');
    }
    await setupDependenciesAsync(logConfig.shouldPrintDependencyLogs || false);
    yarnStartProcess = spawn('yarn', ['start'], {
        cwd: apiRootDir,
    });
    if (logConfig.shouldPrintApiLogs) {
        yarnStartProcess.stdout.on('data', chunk => {
            neatlyPrintChunk('[0x-api]', chunk);
        });
        yarnStartProcess.stderr.on('data', chunk => {
            neatlyPrintChunk('[0x-api | error]', chunk);
        });
    }
    // Wait for the API to boot up
    await waitForApiStartupAsync(yarnStartProcess);
}

/**
 * Tears down the old 0x-api instance.
 * @param logConfig Whether or not the logs from the teardown functions should
 *        be printed.
 */
export async function teardownApiAsync(logConfig: LoggingConfig = {}): Promise<void> {
    if (!yarnStartProcess) {
        throw new Error('There is no 0x-api instance to tear down');
    }
    yarnStartProcess.kill();
    await teardownDependenciesAsync(logConfig.shouldPrintDependencyLogs || false);
}

/**
 * Sets up 0x-api's dependencies.
 * @param shouldPrintLogs Whether or not the logs from `docker-compose up`
 *        should be printed.
 */
export async function setupDependenciesAsync(shouldPrintLogs: boolean = false): Promise<void> {
    // Remove the saved volumes to ensure a sandboxed testing environment.
    await rimrafAsync(`${apiRootDir}/0x_mesh`);
    await rimrafAsync(`${apiRootDir}/postgres`);

    // Spin up the 0x-api dependencies
    const up = spawn('docker-compose', ['up'], {
        cwd: apiRootDir,
        env: {
            ...process.env,
            ETHEREUM_RPC_URL: 'http://ganache:8545',
            ETHEREUM_CHAIN_ID: '1337',
        },
    });
    if (shouldPrintLogs) {
        up.stdout.on('data', chunk => {
            neatlyPrintChunk('[docker-compose up]', chunk);
        });
        up.stderr.on('data', chunk => {
            neatlyPrintChunk('[docker-compose up | error]', chunk);
        });
    }

    // Wait for the dependencies to boot up.
    await waitForDependencyStartupAsync(up);
}

/**
 * Tears down 0x-api's dependencies.
 * @param shouldPrintLogs Whether or not the logs from `docker-compose down`
 *        should be printed.
 */
export async function teardownDependenciesAsync(shouldPrintLogs: boolean = false): Promise<void> {
    const down = spawn('docker-compose', ['down'], {
        cwd: apiRootDir,
    });
    if (shouldPrintLogs) {
        down.stdout.on('data', chunk => {
            neatlyPrintChunk('[docker-compose down]', chunk);
        });
        down.stderr.on('data', chunk => {
            neatlyPrintChunk('[docker-compose down | error]', chunk);
        });
    }
    await new Promise<void>(resolve => {
        down.on('close', () => {
            resolve();
        });
    });
    await rimrafAsync(`${apiRootDir}/0x_mesh`);
    await rimrafAsync(`${apiRootDir}/postgres`);
}

function neatlyPrintChunk(prefix: string, chunk: Buffer): void {
    const data = chunk.toString().split('\n');
    data.filter((datum: string) => datum !== '').map((datum: string) => {
        log.log(prefix, datum.trim());
    });
}

async function waitForApiStartupAsync(logStream: ChildProcessWithoutNullStreams): Promise<void> {
    return new Promise<void>(resolve => {
        logStream.stdout.on('data', (chunk: Buffer) => {
            const data = chunk.toString().split('\n');
            for (const datum of data) {
                if (/API (HTTP) listening on port 3000!/.test(datum)) {
                    resolve();
                }
            }
        });
    });
}

async function waitForDependencyStartupAsync(logStream: ChildProcessWithoutNullStreams): Promise<void> {
    return new Promise<void>(resolve => {
        const hasSeenLog = [false, false, false];
        logStream.stdout.on('data', (chunk: Buffer) => {
            const data = chunk.toString().split('\n');
            for (const datum of data) {
                if (!hasSeenLog[0] && /.*mesh.*started HTTP RPC server/.test(datum)) {
                    hasSeenLog[0] = true;
                } else if (!hasSeenLog[1] && /.*mesh.*started WS RPC server/.test(datum)) {
                    hasSeenLog[1] = true;
                } else if (!hasSeenLog[2] && /.*postgres.*database system is ready to accept connections/.test(datum)) {
                    hasSeenLog[2] = true;
                }

                if (hasSeenLog[0] === true && hasSeenLog[1] === true && hasSeenLog[2] === true) {
                    resolve();
                }
            }
        });
    });
}
