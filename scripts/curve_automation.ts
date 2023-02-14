import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "fs";
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

const generateCodeSnippets = (pools: CurvePool[]) => {
	const versionAddressPool: {[version: string]: {[address: string]: string} } = {};
	versionAddressPool['v1'] = {};
	versionAddressPool['v2'] = {};
	pools.forEach(pool => {
		if (pool.isMetaPool) {
			versionAddressPool['v1'][pool.address] = generateCodeBlock(pool, 'createCurveExchangeUnderlyingPool', '600e3');
		}
		else if (pool.id.includes('v2')){
			versionAddressPool['v2'][pool.address] = generateCodeBlock(pool, 'createCurveExchangeV2Pool', '330e3');
		}
		else {
			versionAddressPool['v1'][pool.address] = generateCodeBlock(pool, 'createCurveExchangePool', '600e3');
		} 
	})
	return versionAddressPool;
}

const CURVE_SOURCE_FILE = '../src/asset-swapper/utils/market_operation_utils/curve.ts'
const addCodeToSource = (version: string, snippets: string[]) => {
	const anchorString = `\/\/ ANCHOR FOR MAINNET ${version.toUpperCase()} DO NOT DELETE`;
	const anchor = new RegExp(`.*${anchorString}`, 'g');
	const sourceToModify = readFileSync(CURVE_SOURCE_FILE, {encoding: 'utf8'});
	const codeToAdd = `${snippets.join('\n')}\n    ${anchorString}`
	const newSource = sourceToModify.replace(anchor, codeToAdd);
	console.log(newSource);
	writeFileSync(CURVE_SOURCE_FILE, newSource);
}

getCurvePools().then((curvePools: {[name: string]: CurvePool}) => {

	const curveInfos = generateCurveInfoMainnet(Object.values(curvePools));

	const versionAddressPool = generateCodeSnippets(Object.values(curvePools));
	Object.entries(versionAddressPool).forEach(([version, addressPool]) => {
		addCodeToSource(version, Object.values(addressPool));
	})
	
});