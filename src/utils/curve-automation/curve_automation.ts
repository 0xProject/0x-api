//1. make this integrate with our library(like using provider, etc)
//2. clean up and make this ready to ship in prod
//3. add comments so ppl know where this is and what it does
//Phase 3. 
//4. brainstorm potential ideas on how we can make this more efficient for us
//5. I.E. how can we just automatically integrate curve pools
//6. dynamic programming
const Web3 = require("web3")
const web3 = new Web3("https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161")
//const FileSystem = require("file-system");

//curve registry ABI and address
var contract_abi = require('./abi.json');
const contract_address = '0xB9fC157394Af804a3578134A6585C0dc9cc990d4';

//curve registry contract
const curve_registry = new web3.eth.Contract(contract_abi, contract_address);

//curve pool count
async function getPoolCount() {
  const count = await curve_registry.methods.pool_count.call().call();
  return count;
}

//address of pool 
async function getPoolAddress(i: any) {
  const address = await curve_registry.methods.pool_list(i).call();
  return address;
}

//coins in pool
async function getPoolCoins(address: any) {
  const coins = await curve_registry.methods.get_coins(address).call();
  return coins;
}

//liquidity in pool
async function getPoolLiquidity(address: any) {
  const liq = await curve_registry.methods.get_balances(address).call();
  const reducer = (accumulator: any, curr: any) => accumulator + curr;
  return liq.reduce(reducer);
}

//pool type
async function getPoolType(address: any) {
  const pool_index = await curve_registry.methods.get_pool_asset_type(address).call();
  const pool_name = ["USD", "BTC", "ETH", "Other StableSwap", "CryptoSwap"];
  return pool_name[pool_index];
}

//pool name, address, coins, and pool type
async function poolInfo(address: any) {
  const coins = await getPoolCoins(address);
  const pool_type = await getPoolType(address);
  const liq = await getPoolLiquidity(address);
  var Obj = {             
    coin: coins,
    poolType: pool_type,
    liquidity: liq  
  };
  return Obj;
}

interface poolData {
  [key: string]: any
}

//returns list of curve pools
export async function getCurvePools() {
  //const ret = {};
  const pool_count = await getPoolCount();
  const ret: poolData = {};

  for (let i = 0; i < pool_count; i++) {
    var pool_address:string = await getPoolAddress(i);
    var pool_info = await poolInfo(pool_address);
    ret[pool_address] = pool_info;
  }
  //uncomment to put curve pool data in a JSON file
  //FileSystem.writeFile('curve.json', JSON.stringify(ret), (error: any) => {
  //  if (error) throw error;
  //});
  return ret;
}


