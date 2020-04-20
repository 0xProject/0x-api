import { logUtils as log } from '@0x/utils';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { promisify } from 'util';

const apiRootDir = path.normalize(path.resolve(`${__dirname}/../../../`));
const rimrafAsync = promisify(rimraf);

export enum LogType {
    Hidden,
    Console,
    File,
}

/**
 * The configuration object that provides information on how verbose the logs
 * should be and where they should be located.
 * @param apiLogType The location where the API logs should be logged.
 * @param dependencyLogType The location where the API's dependency logs should be logged.
 */
export interface LoggingConfig {
    apiLogType: LogType;
    dependencyLogType: LogType;
}

let yarnStartProcess: ChildProcessWithoutNullStreams;

/**
 * Sets up a 0x-api instance.
 * @param logConfig Where logs should be directed.
 */
export async function setupApiAsync(
    logConfig: LoggingConfig = { apiLogType: LogType.Hidden, dependencyLogType: LogType.Hidden },
): Promise<void> {
    if (yarnStartProcess) {
        throw new Error('Old 0x-api instance has not been torn down');
    }
    await setupDependenciesAsync(logConfig.dependencyLogType);
    yarnStartProcess = spawn('yarn', ['start'], {
        cwd: apiRootDir,
    });
    if (logConfig.apiLogType === LogType.Console) {
        yarnStartProcess.stdout.on('data', chunk => {
            neatlyPrintChunk('[0x-api]', chunk);
        });
        yarnStartProcess.stderr.on('data', chunk => {
            neatlyPrintChunk('[0x-api | error]', chunk);
        });
    } else if (logConfig.apiLogType === LogType.File) {
        const logStream = fs.createWriteStream(`${apiRootDir}/api_logs`, { flags: 'a' });
        const errorStream = fs.createWriteStream(`${apiRootDir}/api_errors`, { flags: 'a' });
        yarnStartProcess.stdout.pipe(logStream);
        yarnStartProcess.stderr.pipe(errorStream);
    }
    // Wait for the API to boot up
    await waitForApiStartupAsync(yarnStartProcess);
}

/**
 * Tears down the old 0x-api instance.
 */
export async function teardownApiAsync(): Promise<void> {
    if (!yarnStartProcess) {
        throw new Error('There is no 0x-api instance to tear down');
    }
    yarnStartProcess.kill();
    await teardownDependenciesAsync();
}

/**
 * Sets up 0x-api's dependencies.
 * @param logType Indicates where logs should be directed.
 */
export async function setupDependenciesAsync(logType: LogType = LogType.Hidden): Promise<void> {
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

    // Direct the logs to the appropriate locations.
    if (logType === LogType.Console) {
        up.stdout.on('data', chunk => {
            neatlyPrintChunk('[docker-compose up]', chunk);
        });
        up.stderr.on('data', chunk => {
            neatlyPrintChunk('[docker-compose up | error]', chunk);
        });
    } else if (logType === LogType.File) {
        const logStream = fs.createWriteStream(`${apiRootDir}/dependency_logs`, { flags: 'a' });
        const errorStream = fs.createWriteStream(`${apiRootDir}/dependency_errors`, { flags: 'a' });
        up.stdout.pipe(logStream);
        up.stderr.pipe(errorStream);
    }

    // Wait for the dependencies to boot up.
    await waitForDependencyStartupAsync(up);
}

/**
 * Tears down 0x-api's dependencies.
 */
export async function teardownDependenciesAsync(): Promise<void> {
    const down = spawn('docker-compose', ['down'], {
        cwd: apiRootDir,
    });
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
        const hasSeenLog = [0, 0, 0];
        logStream.stdout.on('data', (chunk: Buffer) => {
            const data = chunk.toString().split('\n');
            for (const datum of data) {
                if (hasSeenLog[0] < 2 && /.*mesh.*started HTTP RPC server/.test(datum)) {
                    hasSeenLog[0]++;
                } else if (hasSeenLog[1] < 2 && /.*mesh.*started WS RPC server/.test(datum)) {
                    hasSeenLog[1]++;
                } else if (
                    // NOTE(jalextowle): Because the `postgres` database is deleted before every
                    // test run, we must skip over the "autovacuming" step that creates a new
                    // postgres table.
                    hasSeenLog[2] < 2 &&
                    /.*postgres.*database system is ready to accept connections/.test(datum)
                ) {
                    hasSeenLog[2]++;
                }

                if (hasSeenLog[0] === 1 && hasSeenLog[1] === 1 && hasSeenLog[2] === 2) {
                    resolve();
                }
            }
        });
    });
}
