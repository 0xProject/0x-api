//WIP

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

let CurvePools_: {[name: string]: CurvePool} = {};

//queries all curve pools and filters by TVL
export async function getCurvePools(): Promise<{[name: string]: CurvePool}> {
	await axios.get(curve_factory_crypto).then((res) => {
		let response: CurveApiResponse = res.data.data;
		response.poolData.forEach((pool: CurvePoolData) => {
			if (pool.usdTotal >500000 && !(integrated_addresses.includes(pool.address))){
				CurvePools_[SantizeCurvePool(`${pool.name}`)] = pool;
			}
		});

	});
	await axios.get(curve_factory).then((res) => {
		let response: CurveApiResponse = res.data.data;
		response.poolData.forEach((pool: CurvePoolData) => {
			if (pool.usdTotal >500000 && !(integrated_addresses.includes(pool.address))){
				CurvePools_[SantizeCurvePool(`${pool.name}`)] = pool;
			}
		});

	});
	await axios.get(curve_crypto).then((res) => {
		let response: CurveApiResponse = res.data.data;
		response.poolData.forEach((pool: CurvePoolData) => {
			if (pool.usdTotal >500000 && !(integrated_addresses.includes(pool.address))){
				CurvePools_[SantizeCurvePool(`${pool.name}`)] = pool;
			}
		});
	});

	return CurvePools_
}

//takes in a curve pool and updates CURVE_MAINNET_INFOS
async function generateCurveInfoMainnet(pool: CurvePool) {
    // Connect to Ethereum network
    const provider = ethers.getDefaultProvider();
    // Get the contract bytecode
    const bytecode = await provider.getCode(pool.address);

	CURVE_MAINNET_INFOS[pool.address] = createCurveFactoryCryptoExchangePool({
		tokens: pool.coinsAddresses,
		pool: pool.address,
		gasSchedule: 600e3,
	})
	//classify curve pool
	if (bytecode.includes(CurveFunctionSelectors.exchange_underlying_uint256) && bytecode.includes(CurveFunctionSelectors.get_dy_uint256)) {
		CURVE_MAINNET_INFOS[pool.address] = createCurveFactoryCryptoExchangePool({
			tokens: pool.coinsAddresses,
			pool: pool.address,
			gasSchedule: 600e3,
		})
	}
	else if (bytecode.includes(CurveFunctionSelectors.exchange_v2) && bytecode.includes(CurveFunctionSelectors.get_dy_v2)){
		CURVE_MAINNET_INFOS[pool.address] = createCurveExchangeV2Pool({
			tokens: pool.coinsAddresses,
			pool: pool.address,
			gasSchedule: 330e3,
		})
	}
	else if (bytecode.includes(CurveFunctionSelectors.exchange_underlying) && bytecode.includes(CurveFunctionSelectors.get_dy_underlying)){
		CURVE_MAINNET_INFOS[pool.address] = createCurveExchangeUnderlyingPool({
			tokens: pool.coinsAddresses,
			pool: pool.address,
			gasSchedule: 600e3,
		})
	}
	else if (bytecode.includes(CurveFunctionSelectors.exchange) && bytecode.includes(CurveFunctionSelectors.get_dy)){
		CURVE_MAINNET_INFOS[pool.address] = createCurveExchangePool({
			tokens: pool.coinsAddresses,
			pool: pool.address,
			gasSchedule: 600e3,
		})
	} 
}

getCurvePools().then((curvePools: {[name: string]: CurvePool}) => {
	//console.log(`Retrieved ${Object.keys(curvePools).length} Curve Pools`);
	for (const pool in curvePools){
		console.log(curvePools[pool])
		generateCurveInfoMainnet(curvePools[pool])
	}
	console.log(CURVE_MAINNET_INFOS)
	return curvePools
});