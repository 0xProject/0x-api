# [1.11.0](https://github.com/0xProject/0x-api/compare/v1.10.2...v1.11.0) (2020-07-20)


### Features

* support ExchangeProxy for swap quotes (Swap V1) ([#262](https://github.com/0xProject/0x-api/issues/262)) ([3415d63](https://github.com/0xProject/0x-api/commit/3415d636df4591188d7a46b10597e511e4659003)), closes [#268](https://github.com/0xProject/0x-api/issues/268) [#269](https://github.com/0xProject/0x-api/issues/269) [#282](https://github.com/0xProject/0x-api/issues/282)
* Updates BZRX token address to new BZRX token ([#279](https://github.com/0xProject/0x-api/issues/279)) ([8032d96](https://github.com/0xProject/0x-api/commit/8032d96173e17f1f050741efb1f63a1edac2d9e5))

## [1.10.2](https://github.com/0xProject/0x-api/compare/v1.10.1...v1.10.2) (2020-07-13)


### Bug Fixes

* Changes latency to be capped at 600ms, added some extra typing ([#275](https://github.com/0xProject/0x-api/issues/275)) ([cd545c8](https://github.com/0xProject/0x-api/commit/cd545c8200a9abe6d53a894a76b89ab40220c327))

## [1.10.1](https://github.com/0xProject/0x-api/compare/v1.10.0...v1.10.1) (2020-07-06)


### Bug Fixes

* egs polling and forwarder buy ([#274](https://github.com/0xProject/0x-api/issues/274)) ([94587d0](https://github.com/0xProject/0x-api/commit/94587d0cee1d7693d616a88e1e4b8b8f895e84fe))
* specify ethgasstation url ([#273](https://github.com/0xProject/0x-api/issues/273)) ([16eabc0](https://github.com/0xProject/0x-api/commit/16eabc090e15c694861b1ef20f9a9a60a5b3f1b8))
* Update to ethgasstation proxy endpoint ([#272](https://github.com/0xProject/0x-api/issues/272)) ([6d0874f](https://github.com/0xProject/0x-api/commit/6d0874ff1410a310f5534b3730f98c208ccfd5dc))

# [1.10.0](https://github.com/0xProject/0x-api/compare/v1.9.0...v1.10.0) (2020-06-29)


### Bug Fixes

* meta txn limiting - synchronize db ([#270](https://github.com/0xProject/0x-api/issues/270)) ([a3448ab](https://github.com/0xProject/0x-api/commit/a3448ab002072d39f50bc33b5970b431b24ba813))
* remove NonceTrackerSubprovider ([#271](https://github.com/0xProject/0x-api/issues/271)) ([7b8aa6e](https://github.com/0xProject/0x-api/commit/7b8aa6e9c09443d951bf92db5342af5186586caf))


### Features

* Add UMA token to 0x API metadata registry ([#266](https://github.com/0xProject/0x-api/issues/266)) ([a057aee](https://github.com/0xProject/0x-api/commit/a057aeec257a738896288ea6c665d96eba5f9d0a))

# [1.9.0](https://github.com/0xProject/0x-api/compare/v1.8.0...v1.9.0) (2020-06-22)


### Bug Fixes

* asset swapper monorepo f14b6f2ba ([#257](https://github.com/0xProject/0x-api/issues/257)) ([a03630a](https://github.com/0xProject/0x-api/commit/a03630a918c98918ce114a7b6bc5a73ce197da94))
* Disable quote validation temporarily ([#259](https://github.com/0xProject/0x-api/issues/259)) ([6064f3e](https://github.com/0xProject/0x-api/commit/6064f3e58054da3ab0b44bac0b7d24d1cf672497))
* filter tokens in prices which do not exist on the network ([#265](https://github.com/0xProject/0x-api/issues/265)) ([864ea92](https://github.com/0xProject/0x-api/commit/864ea9203af8f30890f851bd32ffde199712504d))
* Fix parameters sent off to RFQT providers to be unescaped ([#264](https://github.com/0xProject/0x-api/issues/264)) ([939cae1](https://github.com/0xProject/0x-api/commit/939cae1ca9a35d762c05be79a27de45870b9079e))
* validation gas limit ([#260](https://github.com/0xProject/0x-api/issues/260)) ([f50425c](https://github.com/0xProject/0x-api/commit/f50425c977723f7402b80dec2cb24ffcd23b969e)), closes [#259](https://github.com/0xProject/0x-api/issues/259)
* WETH wrap gas estimate ([#256](https://github.com/0xProject/0x-api/issues/256)) ([f07b4a8](https://github.com/0xProject/0x-api/commit/f07b4a810edb22002266a126b1e2128e25be1323))


### Features

* add signer liveness status gauge ([#255](https://github.com/0xProject/0x-api/issues/255)) ([11446e7](https://github.com/0xProject/0x-api/commit/11446e786a5ca62d0d12b1303bdf97827e3daf06))
* support renamed parameters in RFQT maker endpoint ([#258](https://github.com/0xProject/0x-api/issues/258)) ([d83bbb1](https://github.com/0xProject/0x-api/commit/d83bbb1ee01ca8885d0a95db6ee08ca4d9b25bf4))

# [1.8.0](https://github.com/0xProject/0x-api/compare/v1.7.0...v1.8.0) (2020-06-15)


### Bug Fixes

* uniswap v2 buys ([#253](https://github.com/0xProject/0x-api/issues/253)) ([225db22](https://github.com/0xProject/0x-api/commit/225db22b71f36344f71c53178c41eb1648b1cbba))


### Features

* Add support for UniswapV2 and MultiBridge ([#250](https://github.com/0xProject/0x-api/issues/250)) ([29636e7](https://github.com/0xProject/0x-api/commit/29636e7a2d69e2077ee1a496b99767e02239f737)), closes [#252](https://github.com/0xProject/0x-api/issues/252)
* add transaction price information to meta-txn endpoints for UI ([#248](https://github.com/0xProject/0x-api/issues/248)) ([d26d6c6](https://github.com/0xProject/0x-api/commit/d26d6c6958798dddbb889cdf74e01285eacbd7f6))

# [1.7.0](https://github.com/0xProject/0x-api/compare/v1.6.0...v1.7.0) (2020-06-08)


### Bug Fixes

* Add RFQT configs when instantiating SwapQuoter ([#218](https://github.com/0xProject/0x-api/issues/218)) ([28e1214](https://github.com/0xProject/0x-api/commit/28e1214186c3285ca61de9bd7ca38ec84f9cbf32))


### Features

* added rewards per ZRX to pools endpoint ([#235](https://github.com/0xProject/0x-api/issues/235)) ([d8b8941](https://github.com/0xProject/0x-api/commit/d8b8941f9492720254b6a8d7c491ad16a3deedd4))
* return ethereum transaction status in the response from metatxn status ([#247](https://github.com/0xProject/0x-api/issues/247)) ([ce973a2](https://github.com/0xProject/0x-api/commit/ce973a2cac07fd9dcf783f284f3db125c242317f))

# [1.6.0](https://github.com/0xProject/0x-api/compare/v1.5.0...v1.6.0) (2020-06-01)


### Bug Fixes

* Re-pin asset-swapper to latest monorepo commit ([#240](https://github.com/0xProject/0x-api/issues/240)) ([dfbf0e7](https://github.com/0xProject/0x-api/commit/dfbf0e719fe1a2371e0a2e5dcc9a2824f9de4529))


### Features

* add estimatedGas, estimatedGasTokenRefund and minimumProtocolFee to /quote and /price  response ([#237](https://github.com/0xProject/0x-api/issues/237)) ([f7f3277](https://github.com/0xProject/0x-api/commit/f7f3277510fcc05f03f0a187e64364e02305e3ee))

# [1.5.0](https://github.com/0xProject/0x-api/compare/v1.4.0...v1.5.0) (2020-05-25)


### Bug Fixes

* unify the response data from /swap/v0/price and /meta_transaction/v0/price ([#228](https://github.com/0xProject/0x-api/issues/228)) ([62f3fae](https://github.com/0xProject/0x-api/commit/62f3fae42a8ab7e73b644f0e8c523d655e6319e8))


### Features

* Add Prometheus Monitoring ([#222](https://github.com/0xProject/0x-api/issues/222)) ([5a51add](https://github.com/0xProject/0x-api/commit/5a51add4f0351d1e8567817411cdd24a984c2c28))
* added an epochs/n endpoint to get info on an arbitrary epoch ([#230](https://github.com/0xProject/0x-api/issues/230)) ([68ec159](https://github.com/0xProject/0x-api/commit/68ec1595b99c15e50c5cfeae682cf16b68d83be1))
* lower default slippage percentage to 1% ([#238](https://github.com/0xProject/0x-api/issues/238)) ([c7ec0ff](https://github.com/0xProject/0x-api/commit/c7ec0ff80d13d141dbc062b88ef5a97fd5b387a3))
* MetaTxn add signer heartbeat and status ([#236](https://github.com/0xProject/0x-api/issues/236)) ([3a11867](https://github.com/0xProject/0x-api/commit/3a118670ec6376203400650f39b93e06fc1c76af))
* set default skip RFQt buy requests to false ([#232](https://github.com/0xProject/0x-api/issues/232)) ([a5d7a1c](https://github.com/0xProject/0x-api/commit/a5d7a1ce8d539382fada237f77fbcb637aaf3791))

# [1.4.0](https://github.com/0xProject/0x-api/compare/v1.3.0...v1.4.0) (2020-05-18)

### Bug Fixes

-   re-allow unknown tokens to be queried in the swap/quote endpoint ([#226](https://github.com/0xProject/0x-api/issues/226)) ([1379e63](https://github.com/0xProject/0x-api/commit/1379e638693e030ab343adfa9893a6f42081ea01))

### Features

-   add transaction watcher service ([#215](https://github.com/0xProject/0x-api/issues/215)) ([7bbb9c6](https://github.com/0xProject/0x-api/commit/7bbb9c6f0992ae2a9a9ae9f2fe6d59f99a8e121a))
-   Improve RFQ-T logging ([#219](https://github.com/0xProject/0x-api/issues/219)) ([22b6b0c](https://github.com/0xProject/0x-api/commit/22b6b0c1fb15513bc1225ca5f3a8918639fe8f32))

# [1.3.0](https://github.com/0xProject/0x-api/compare/v1.2.0...v1.3.0) (2020-05-11)

### Features

-   Remove Kyber exclusion ([#211](https://github.com/0xProject/0x-api/issues/211)) ([aa600ab](https://github.com/0xProject/0x-api/commit/aa600abd74bb963303720d8a3cdf3b5f5044ae4f))
-   RFQ-T follow-ups ([#201](https://github.com/0xProject/0x-api/issues/201)) ([a55f22e](https://github.com/0xProject/0x-api/commit/a55f22ee866f0ce8a8e5164829bc511838019a47)), closes [/github.com/0xProject/0x-api/pull/201#discussion_r417775612](https://github.com//github.com/0xProject/0x-api/pull/201/issues/discussion_r417775612)

# [1.2.0](https://github.com/0xProject/0x-api/compare/v1.1.0...v1.2.0) (2020-05-04)

### Bug Fixes

-   specify an image name for the Docker push, fix typos ([512deab](https://github.com/0xProject/0x-api/commit/512deab78da744e86ca7e2f58d2c6e09e4f78c05))

### Features

-   Added pool breakdown of operator vs member stake, added option to add… ([#202](https://github.com/0xProject/0x-api/issues/202)) ([e20daa5](https://github.com/0xProject/0x-api/commit/e20daa5bb1cf6271b83d977459227fd80d1794cd))

# [1.1.0](https://github.com/0xProject/0x-api/compare/v1.0.0...v1.1.0) (2020-05-01)

### Bug Fixes

-   sixtySecondsFromNow timestamp ([#208](https://github.com/0xProject/0x-api/issues/208)) ([f82785d](https://github.com/0xProject/0x-api/commit/f82785ddd9ee465ae70907d443e79df3369e093c))
-   Typo in semantic release configuration ([d4030a0](https://github.com/0xProject/0x-api/commit/d4030a085d7f6847504087e97608c93c7031b57e))

### Features

-   Support RFQT via Meta-txn Endpoints ([#203](https://github.com/0xProject/0x-api/issues/203)) ([ea9a7e0](https://github.com/0xProject/0x-api/commit/ea9a7e0ad32855796c4cf9ef125b075f5761e71d))
