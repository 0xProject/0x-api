import { ethers } from "ethers";
import axios from "axios";
const curve_factory_crypto = "https://api.curve.fi/api/getPools/ethereum/factory-crypto";
const curve_factory = "https://api.curve.fi/api/getPools/ethereum/factory";
const curve_crypto = "https://api.curve.fi/api/getPools/ethereum/crypto";
import {
    CURVE_POOLS, CURVE_V2_POOLS, CURVE_POLYGON_POOLS,
    CURVE_V2_POLYGON_POOLS, CURVE_AVALANCHE_POOLS, CURVE_V2_AVALANCHE_POOLS, 
    CURVE_FANTOM_POOLS, CURVE_V2_FANTOM_POOLS, CURVE_OPTIMISM_POOLS, CURVE_V2_ARBITRUM_POOLS}
from '../src/asset-swapper/utils/market_operation_utils/curve'

import { CurveFunctionSelectors } from "../src/asset-swapper/utils/market_operation_utils/types";

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

const createCurveExchangePool = [CurveFunctionSelectors.exchange, CurveFunctionSelectors.get_dy]
const createCurveExchangeUnderlyingPool = [CurveFunctionSelectors.exchange_underlying,CurveFunctionSelectors.get_dy_underlying]
const createCurveExchangeV2Pool = [CurveFunctionSelectors.exchange_v2, CurveFunctionSelectors.get_dy_v2]

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

export async function getCurvePools(): Promise<{[name: string]: CurvePool}> {
	await axios.get(curve_factory_crypto).then((res) => {
		let response: CurveApiResponse = res.data.data;
		response.poolData.forEach((pool: CurvePoolData) => {
			CurvePools_[SantizeCurvePool(`${pool.name}`)] = pool;
		});

	});
	await axios.get(curve_factory).then((res) => {
		let response: CurveApiResponse = res.data.data;
		response.poolData.forEach((pool: CurvePoolData) => {
			CurvePools_[SantizeCurvePool(`${pool.name}`)] = pool;
		});

	});
	await axios.get(curve_crypto).then((res) => {
		let response: CurveApiResponse = res.data.data;
		response.poolData.forEach((pool: CurvePoolData) => {
			CurvePools_[SantizeCurvePool(`${pool.name}`)] = pool;
		});
	});

    const filteredCurvePools_ = Object.entries(CurvePools_).reduce((obj, [name, pool]) => {
        obj[name] = { address: pool.address, totalSupply: pool.usdTotal };
        return obj;
    }, {});

    return filteredCurvePools_;
}

async function getFunctionSelectors(address) {
    // Connect to Ethereum network
    const provider = new ethers.providers.InfuraProvider('mainnet');

    // Get the contract bytecode
    const bytecode = await provider.getCode(address);

}