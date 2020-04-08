import { logUtils as log } from '@0x/utils';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { resolve as resolvePath } from 'path';

const apiRootDir = resolvePath(`${__dirname}/../../../`);

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
    // HACK(jalextowle): This should really be replaced by log-scraping, but it
    // does appear to work for now.
    await sleepAsync(10000); // tslint:disable-line:custom-no-magic-numbers
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
    // HACK(jalextowle): This should really be replaced by log-scraping, but it
    // does appear to work for now.
    await sleepAsync(10000); // tslint:disable-line:custom-no-magic-numbers
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
}

function neatlyPrintChunk(prefix: string, chunk: Buffer): void {
    const data = chunk.toString().split('\n');
    data.filter((datum: string) => datum !== '').map((datum: string) => {
        log.log(prefix, datum.trim());
    });
}

async function sleepAsync(duration: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(resolve, duration);
    });
}
