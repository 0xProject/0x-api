# Step 1 - Cancel order

## Request

```
POST /order/cancel

{
    "order" : {
        "senderAddress": "0x0000000000000000000000000000000000000000",
        "makerAddress": "0x5496e6ac4574da8b3481bbcf3b8f6c3a52afab15",
        "takerAddress": "0x0000000000000000000000000000000000000000",
        "makerFee": "0",
        "takerFee": "0",
        "makerAssetAmount": "923382249654695025402",
        "takerAssetAmount": "923887432",
        "makerAssetData": "0xf47261b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
        "takerAssetData": "0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "salt": "1575571567001",
        "exchangeAddress": "0x61935cbdd02287b511119ddb11aeb42f1593b7ef",
        "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
        "expirationTimeSeconds": "1575571807",
        "makerFeeAssetData": "0x",
        "chainId": 1,
        "takerFeeAssetData": "0x"
    }
}
```

## Response

```json
{
    "from": "0x....",
    "to": "0x....",
    "data": "0x....",
    "gasPrice": "0x....",
    "gasLimit": "0x....",
}
```

# Step 2 - Validate and complete the order

## Request

```json
POST /order/complete

{
    "path": "/orders/complete",
    "method": "POST",
    "payload" : {
        "order" : {
            "senderAddress": "0x0000000000000000000000000000000000000000",
            "makerAddress": "0x5496e6ac4574da8b3481bbcf3b8f6c3a52afab15",
            "takerAddress": "0x0000000000000000000000000000000000000000",
            "makerFee": "0",
            "takerFee": "0",
            "makerAssetAmount": "923382249654695025402",
            "takerAssetAmount": "923887432",
            "makerAssetData": "0xf47261b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
            "takerAssetData": "0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "salt": "1575571567001",
            "exchangeAddress": "0x61935cbdd02287b511119ddb11aeb42f1593b7ef",
            "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
            "expirationTimeSeconds": "1575571807",
            "makerFeeAssetData": "0x",
            "chainId": 1,
            "takerFeeAssetData": "0x"
        }
    },
    "toSign": {
        "variableName": "signatureHexOfOrderHash",
        "payload": "0x568377ab709f258efaa3b6d8a1da2310e4835f53cdb9700edcc7112e97a7fdc3",
        "destination": "0xo18792847y892yo87yo2387y4296734972y387h8h283g423g48723g23uyg4iuy2b3u4"
    }
}
```

## Response

```json
{
    "order" : {
        "senderAddress": "0x0000000000000000000000000000000000000000",
        "makerAddress": "0x5496e6ac4574da8b3481bbcf3b8f6c3a52afab15",
        "takerAddress": "0x0000000000000000000000000000000000000000",
        "makerFee": "0",
        "takerFee": "0",
        "makerAssetAmount": "923382249654695025402",
        "takerAssetAmount": "923887432",
        "makerAssetData": "0xf47261b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
        "takerAssetData": "0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "salt": "1575571567001",
        "exchangeAddress": "0x61935cbdd02287b511119ddb11aeb42f1593b7ef",
        "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
        "expirationTimeSeconds": "1575571807",
        "makerFeeAssetData": "0x",
        "chainId": 1,
        "takerFeeAssetData": "0x",
        "signature": "0xo18792847y892yo87yo2387y4296734972y387h8h283g423g48723g23uyg4iuy2b3u4"
    }
}
```