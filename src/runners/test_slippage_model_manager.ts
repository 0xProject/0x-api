
import { S3 } from "aws-sdk";
import { S3Client } from "../utils/s3_client";
import { SlippageModelDataManager } from "../utils/slippage_model_data_manager";

const s3 = new S3({
    apiVersion: '2006-03-01',
});
const smanager = new SlippageModelDataManager(new S3Client(s3));
smanager.initializeAsync().then(() => {
    console.log('Data from cache:');
    console.log(smanager.get('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'Uniswap_V2'));
    console.log(smanager.get('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 'Uniswap_V2'));
    console.log(smanager.get('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 'Uniswap_V3'));
});