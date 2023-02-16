import { ethers } from "ethers";
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
import { delay } from "lodash";

const apiKey = 'EB9X88T9PHNANG5VF3YYZ7CDWP4WD46HNE'
const MIN_TVL = 500000
let CURVE_MAINNET_INFOS: { [name: string]: CurveInfo } = {}

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

async function getGasSchedule(address: string) {
	const url = `https://api.etherscan.io/api?module=logs&action=getLogs&address=${address}&page=1&offset=1000&apikey=${apiKey}`
	let retryCount = 0;
	const maxRetries = 3;
	let waitTime = (2 ** retryCount) * 1000;
	//console.log(address)
	while (retryCount < maxRetries) {
		try {
		const response = await axios.get(url);
		const logs = response.data.result;
		if (Array.isArray(logs)) {
			const totalGas = logs.reduce(
			(acc: number, log: { gasUsed: string }) => acc + parseInt(log.gasUsed, 16),
			0
			);
			const averageGas = totalGas / logs.length;
			return averageGas;
		} else {
			return 600e3;
		}
		} catch (error) {
		console.log(`Error getting logs: ${error.message}`);

		if (error.response && error.response.status === 429) {
			console.log(`Rate limit reached. Retrying in ${waitTime / 1000} seconds...`);
			retryCount++;
			await new Promise((resolve) => setTimeout(resolve, waitTime));
			waitTime = (2 ** retryCount) * 1000;
		} else {
			console.log('Unknown error. Aborting...');
			break;
		}
		}
	}
}

//takes in a curve pool and updates CURVE_MAINNET_INFOS
async function generateCurveInfoMainnet(pools: CurvePool[]) {

	const curveInfos: {[name: string]: CurveInfo} = {}
	for (const pool of pools) {
		const gas = await getGasSchedule(pool.address)
		if (pool.isMetaPool) {
			curveInfos[pool.address] = createCurveExchangeUnderlyingPool({
				tokens: pool.coinsAddresses,
				pool: pool.address,
				gasSchedule:  gas ? gas : 600e3,
			})
		}
		else if (pool.id.includes('v2')){
			curveInfos[pool.address] = createCurveExchangeV2Pool({
				tokens: pool.coinsAddresses,
				pool: pool.address,
				gasSchedule: gas ? gas : 300e3,
			})
		}
		else {
			curveInfos[pool.address] = createCurveExchangePool({
				tokens: pool.coinsAddresses,
				pool: pool.address,
				gasSchedule: gas ? gas : 600e3,
			})
		} 
	}
	return curveInfos;
}

getCurvePools().then(async (curvePools: {[name: string]: CurvePool}) => {

	const curveInfos = await generateCurveInfoMainnet(Object.values(curvePools));
	console.log(curveInfos)
	JSON.stringify(curveInfos)
	console.log(JSON.stringify(curveInfos, null, 2))
	return curvePools
});