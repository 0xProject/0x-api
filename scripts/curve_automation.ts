import { ethers } from "ethers";
import { readFileSync, writeFileSync, createWriteStream, constants as FS_CONST} from "fs";
import { ChildProcessWithoutNullStreams, execSync, spawn } from 'child_process';
import axios from "axios";
const curve_factory_crypto = "https://api.curve.fi/api/getPools/ethereum/factory-crypto";
const curve_factory = "https://api.curve.fi/api/getPools/ethereum/factory";
const curve_crypto = "https://api.curve.fi/api/getPools/ethereum/crypto";
import {
	createCurveExchangePool, createCurveExchangeUnderlyingPool, createCurveExchangeV2Pool,
	createCurveFactoryCryptoExchangePool, CURVE_POOLS, CURVE_V2_POOLS, CURVE_POLYGON_POOLS,
    CURVE_V2_POLYGON_POOLS, CURVE_AVALANCHE_POOLS, CURVE_V2_AVALANCHE_POOLS, 
    CURVE_FANTOM_POOLS, CURVE_V2_FANTOM_POOLS, CURVE_OPTIMISM_POOLS, CURVE_V2_ARBITRUM_POOLS}
from '../src/asset-swapper/utils/market_operation_utils/curve'
import { CurveFunctionSelectors, CurveInfo } from "../src/asset-swapper/utils/market_operation_utils/types";
import { version } from "uuid-validate";
import { exit } from "process";

const MIN_TVL = 500000

const integrated_addresses = [
    Object.values(CURVE_POOLS),
    Object.values(CURVE_V2_POOLS),
    Object.values(CURVE_POLYGON_POOLS),
    Object.values(CURVE_V2_POLYGON_POOLS),
    Object.values(CURVE_AVALANCHE_POOLS),
    Object.values(CURVE_V2_AVALANCHE_POOLS),
    Object.values(CURVE_FANTOM_POOLS),
    Object.values(CURVE_V2_FANTOM_POOLS),
    Object.values(CURVE_OPTIMISM_POOLS),
    Object.values(CURVE_V2_ARBITRUM_POOLS)
    ].flat();

interface CurveApiResponse {
	poolData: [];
	tvlAll: number;
	tvl: number;
}
export interface CurvePoolData {
	id: string;
	address: string;
	coinsAddresses: [];
	decimals: [];
	virtualPrice: number;
	lpTokenAddress: string;
	implementationAddress: string;
	name: string;
	symbol: string;
	totalsupply: string;
	priceoracle: number;
	poolUrls: [];
	coins: [];
	usdTotal: number;
	isMetaPool: boolean;
}

export interface CurvePool{
	id: string;
	address: string;
	coinsAddresses: [];
	decimals: [];
	lpTokenAddress: string;
	implementationAddress: string;
	name: string;
	symbol: string;
	priceoracle: number;
	poolUrls: [];
	coins: [];
	usdTotal: number;
	isMetaPool: boolean;
}

function SantizeCurvePool(name: string){
	name = name.replace(/[^a-z0-9áéíóúñü-\s\.,]/gim,"_");
	name = name.replace(/ /g,"_");
	name = name.replace("__","_");
	return name.trim();
}


//queries all curve pools and filters by TVL
export async function getCurvePools(): Promise<{[name: string]: CurvePool}> {
	const curvePools: {[name: string]: CurvePool} = {};
	await axios.get(curve_factory_crypto).then((res) => {
		let response: CurveApiResponse = res.data.data;
		response.poolData.forEach((pool: CurvePoolData) => {
			if (pool.usdTotal >MIN_TVL && !(integrated_addresses.includes(pool.address))){
				curvePools[SantizeCurvePool(`${pool.name}`)] = pool;
			}
		});

	});
	await axios.get(curve_factory).then((res) => {
		let response: CurveApiResponse = res.data.data;
		response.poolData.forEach((pool: CurvePoolData) => {
			if (pool.usdTotal >MIN_TVL && !(integrated_addresses.includes(pool.address))){
				curvePools[SantizeCurvePool(`${pool.name}`)] = pool;
			}
		});

	});
	await axios.get(curve_crypto).then((res) => {
		let response: CurveApiResponse = res.data.data;
		response.poolData.forEach((pool: CurvePoolData) => {
			if (pool.usdTotal >MIN_TVL && !(integrated_addresses.includes(pool.address))){
				curvePools[SantizeCurvePool(`${pool.name}`)] = pool;
			}
		});
	});

	return curvePools
}

//takes in a curve pool and updates CURVE_MAINNET_INFOS
function generateCurveInfoMainnet(pools: CurvePool[]) {
	//getting rate limited on etherscan even with Pro API Key
	// Connect to Ethereum network
    //const provider = ethers.getDefaultProvider();

	//get contract abi
	//const address = pool.address
	//const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`
	//const res = await axios.get(url)
	//const abi = JSON.parse(res.data.result)

	//classify curve pool

	const curveInfos: {[name: string]: CurveInfo} = {}
	pools.forEach(pool => {
		if (pool.isMetaPool) {
			curveInfos[pool.address] = createCurveExchangeUnderlyingPool({
				tokens: pool.coinsAddresses,
				pool: pool.address,
				gasSchedule: 600e3,
			})
		}
		else if (pool.id.includes('v2')){
			curveInfos[pool.address] = createCurveExchangeV2Pool({
				tokens: pool.coinsAddresses,
				pool: pool.address,
				gasSchedule: 330e3,
			})
		}
		else {
			curveInfos[pool.address] = createCurveExchangePool({
				tokens: pool.coinsAddresses,
				pool: pool.address,
				gasSchedule: 600e3,
			})
		} 
	})
	return curveInfos;
}

const generateTokenList = (tokens: string[]) => {
	const inner = tokens.map(token => `'${token}'`).join(",")
	return `[${inner}]`
}

const generateCodeBlock = (pool: CurvePool, fnName: string, gas: string) => {
return `    '${pool.address}': ${fnName}({
        tokens: ${generateTokenList(pool.coinsAddresses)},
        pool: '${pool.address}',
        gasSchedule: ${gas},
    }),`
}

type VersionAddressPool = {[version: string]: {[address: string]: string} };
type VersionPool = {[version: string]: CurvePool[]};

const generatedCodeForPool = (pool: CurvePool): string => {
	if (pool.isMetaPool) {
		return generateCodeBlock(pool, 'createCurveExchangeUnderlyingPool', '600e3');
	}
	else if (pool.id.includes('v2')){
		return generateCodeBlock(pool, 'createCurveExchangeV2Pool', '330e3');
	}
	else {
		return generateCodeBlock(pool, 'createCurveExchangePool', '600e3');
	} 
}

const poolByVersion = (pools: CurvePool[]): VersionPool => {
	const versionPool: VersionPool = {};
	versionPool['v1'] = [];
	versionPool['v2'] = [];
	pools.forEach(pool => {
		if (pool.isMetaPool) {
			versionPool['v1'].push(pool);
		}
		else if (pool.id.includes('v2')){
			versionPool['v2'].push(pool);
		}
		else {
			versionPool['v1'].push(pool);
		} 
	})
	return versionPool
}

const ROOT_DIR = process.env.ZERO_EX_REPOS;
const CURVE_SOURCE_FILE =`${ROOT_DIR}/0x-api/src/asset-swapper/utils/market_operation_utils/curve.ts`
const API_LOG_FILE = `${ROOT_DIR}/0x-api/scripts/logs/0x-api.log`
const RESULTS_FILE = `${ROOT_DIR}/0x-api/scripts/logs/auto_curve.log`
const SIMBOT_DIR = `${ROOT_DIR}/0x-api-simbot/`

const addPoolsToSource = (version: string, snippets: string[]) => {
	const anchorString = `\/\/ ANCHOR FOR MAINNET ${version.toUpperCase()} DO NOT DELETE`;
	const anchor = new RegExp(`.*${anchorString}`, 'g');
	const sourceToModify = readFileSync(CURVE_SOURCE_FILE, {encoding: 'utf8'});
	const codeToAdd = `${snippets.join('\n')}\n    ${anchorString}`
	const newSource = sourceToModify.replace(anchor, codeToAdd);
	console.log(newSource);
	writeFileSync(CURVE_SOURCE_FILE, newSource);
}

const versionToVarName: { [version: string]: string} = {
	'v1': 'CURVE_MAINNET_INFOS',
	'v2': 'CURVE_V2_MAINNET_INFOS',
}

const createCurveInfos = (version: string, snippet: string) => {
return `export const ${versionToVarName[version]}: { [name: string]: CurveInfo } = {
	${snippet}
};
`
}

const createSingleEntryCurveInfo = (version: string, snippet: string) => {
	const sourceCode = readFileSync(CURVE_SOURCE_FILE, {encoding: 'utf8'});
	const emptyBlock = createCurveInfos(version === 'v1' ? 'v2' : 'v1', '');
	const newCode = `${sourceCode}\n${createCurveInfos(version, snippet)}\n${emptyBlock}`
	writeFileSync(CURVE_SOURCE_FILE, newCode);
}

const renameVar = (version: string) => {
	const varName = versionToVarName[version];
	const re = new RegExp(`${varName}:`, 'g');
	const sourceCode = readFileSync(CURVE_SOURCE_FILE, {encoding: 'utf8'});
	const newCode = sourceCode.replace(re, `${varName}_TMP:`);
	writeFileSync(CURVE_SOURCE_FILE, newCode);
}

const runSimbot = (tokenAddresses: string[]) => {

	const tokenList = tokenAddresses.map((token, index) => {
		return `TOKEN_${index}=${token}`
	})
	
	const nodeRPC = process.env.ETHEREUM_RPC_URL;
	const partialCommand = 'yarn start-ab '
	// TODO: fix this once simbot supports ABC=0x....
	const args = [
		'-u', 'dev=http://localhost:3000/swap/v1/quote?includeSources=Curve,Curve_V2',
		'--swap-value', '1000 10000 100000 1000000',
		'-p', 'USDC/DAI',
		// '--token-address-list', tokenList,
		'-d', '20s',
		'--swap-wait', '5',
	];
	const fullCommand = `${partialCommand}${args.join(' ')}`
	const env = {
		...process.env,
		NODE_RPC: nodeRPC, 
	}
	const buf = execSync(fullCommand, { env, cwd: SIMBOT_DIR });
	const res = '' + buf;
	return res;
}

type VersionPoolSimbotSuccess= {[version: string]: {[poolAddress: string]: boolean}};

const testNewCurvePools = (versionPool: VersionPool): VersionPoolSimbotSuccess => {
	const ret: VersionPoolSimbotSuccess = {
		'v1': {},
		'v2': {},
	};
	const sourceBackup = readFileSync(CURVE_SOURCE_FILE, {encoding: 'utf8'});
	Object.keys(versionPool).forEach(renameVar);

	try {
		Object.entries(versionPool).forEach(([version, pools]) => {
			pools.forEach(pool => {
				let apiProcess: ChildProcessWithoutNullStreams | null = null;
				const zrxLogStream = createWriteStream(API_LOG_FILE, {flags: 'a'});
				try {
					console.log(`starting test for curve pool ${pool.address}`)
					const snippet = generatedCodeForPool(pool)
					createSingleEntryCurveInfo(version, snippet)
					const res = execSync('yarn build');
					console.log('' + res);
					apiProcess = spawn('yarn', ['start']);
					apiProcess.stdout.pipe(zrxLogStream);
					apiProcess.stderr.pipe(zrxLogStream);
					console.log(`the pid is ${apiProcess.pid}`);

					const simbotResutls = runSimbot(pool.coins);
					console.log(simbotResutls);
					const matches = [...simbotResutls.matchAll(/BUY|SELL/g)];
					const numMatches = matches.length
					console.log('numMatches', numMatches);
					ret[version][pool.address] = numMatches > 0;
					console.log('ret', ret[version][pool.address]);
				} catch (e) {
					console.log('an error',e);
				} finally {
					if (apiProcess) {
						apiProcess.kill();
					}
					zrxLogStream.close();
					writeFileSync(CURVE_SOURCE_FILE, sourceBackup);
				}
				// TODO: remove only used to short circuit for testing
				throw new Error('blah')
			})
		})

	} finally {
		const results: string[] = [];
		Object.entries(ret).forEach(([version, poolAddress]) => {
			Object.entries(poolAddress).forEach(([address,success]) => {
				results.push(`${version},${address},${success}`)
			})
		})
		console.log('going to write results to file');
		writeFileSync(RESULTS_FILE, results.join('\n'));
	}

	return ret;
}

// const testNewCurvePools = (versionAddressPool: VersionAddressPool) => {
// 	const sourceBackup = readFileSync(CURVE_SOURCE_FILE, {encoding: 'utf8'});
// 	Object.keys(versionAddressPool).forEach(renameVar);
// 	Object.entries(versionAddressPool).forEach(([version, addressPool]) => {
// 		Object.entries(addressPool).forEach(([address, snippet]) => {
// 			console.log(`starting test for curve pool ${address}`)
// 			createSingleEntryCurveInfo(version, snippet)
// 			const res = execSync('yarn build');
// 			console.log('' + res);
// 			const apiProcess = spawn('yarn start');
// 			const zrxLogStream = createWriteStream(API_LOG_FILE, {flags: 'a'});
// 			apiProcess.stdout.pipe(zrxLogStream);
// 			apiProcess.stderr.pipe(zrxLogStream);
// 			console.log(`the pid is ${apiProcess.pid}`);

// 			runSimbot()



// 			apiProcess.kill();
// 			zrxLogStream.close();
// 			exit(1)

// 			// configure simbot
// 			// run simbot for x seconds
// 			// kill 0x-api process
// 			// check for successful trades
			
// 			// writeFileSync(CURVE_SOURCE_FILE, sourceBackup);
// 		})
// 	})

// 	// Object.entries(versionAddressPool).forEach(([version, addressPool]) => {



// 	// });

// }

getCurvePools().then((curvePools: {[name: string]: CurvePool}) => {

	const curveInfos = generateCurveInfoMainnet(Object.values(curvePools));
	const versionPool = poolByVersion(Object.values(curvePools));

	testNewCurvePools(versionPool);

	

	
});