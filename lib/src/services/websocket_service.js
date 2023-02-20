"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketService = void 0;
const utils_1 = require("@0x/utils");
const _ = require("lodash");
const WebSocket = require("ws");
const errors_1 = require("../errors");
const logger_1 = require("../logger");
const error_handling_1 = require("../middleware/error_handling");
const schemas_1 = require("../schemas");
const types_1 = require("../types");
const order_watcher_utils_1 = require("../utils/order_watcher_utils");
const schema_utils_1 = require("../utils/schema_utils");
const getRandomKafkaConsumerGroupId = () => {
    const randomHex = utils_1.hexUtils.random(4).substr(2);
    return `sra_0x_api_service_${randomHex}`;
};
const DEFAULT_OPTS = {
    pongInterval: 5000,
    path: '/',
    kafkaTopic: 'order_watcher_events',
    kafkaConsumerGroupId: getRandomKafkaConsumerGroupId(),
};
/* A websocket server that sends order updates to subscribed
 * clients. The server listens on the supplied path for
 * subscription requests from relayers. It also forwards to
 * order events from the order watcher to the subscribed clients
 * in real time.
 */
class WebsocketService {
    constructor(server, kafkaClient, opts) {
        this._requestIdToSocket = new Map(); // requestId to WebSocket mapping
        this._requestIdToSubscriptionOpts = new Map(); // requestId -> { base, quote }
        const wsOpts = {
            ...DEFAULT_OPTS,
            ...opts,
        };
        this._server = new WebSocket.Server({ server, path: wsOpts.path });
        this._server.on('connection', this._processConnection.bind(this));
        this._server.on('error', WebsocketService._handleError.bind(this));
        this._pongIntervalId = setInterval(this._cleanupConnections.bind(this), wsOpts.pongInterval);
        this._kafkaClient = kafkaClient;
        this._orderWatcherKafkaEventConsumer = this._kafkaClient.consumer({
            groupId: wsOpts.kafkaConsumerGroupId,
        });
        this._orderWatcherKafkaEventTopic = wsOpts.kafkaTopic;
    }
    static _matchesOrdersChannelSubscription(order, opts) {
        if (opts === 'ALL_SUBSCRIPTION_OPTS') {
            return true;
        }
        const { makerToken, takerToken } = order;
        // If the user provided a makerToken or takerToken that does not match the order we skip
        if ((opts.takerToken && takerToken.toLowerCase() !== opts.takerToken.toLowerCase()) ||
            (opts.makerToken && makerToken.toLowerCase() !== opts.makerToken.toLowerCase())) {
            return false;
        }
        return true;
    }
    static _handleError(_ws, err) {
        logger_1.logger.error(new errors_1.WebsocketServiceError(err));
    }
    // TODO: Rename to subscribe?
    async startAsync() {
        await this._orderWatcherKafkaEventConsumer.connect();
        await this._orderWatcherKafkaEventConsumer.subscribe({ topic: this._orderWatcherKafkaEventTopic });
        await this._orderWatcherKafkaEventConsumer.run({
            eachMessage: async ({ message }) => {
                // do nothing if no value present
                if (!message.value) {
                    return;
                }
                const messageString = message.value.toString();
                try {
                    const jsonMessage = JSON.parse(messageString);
                    const sraOrders = [(0, order_watcher_utils_1.orderWatcherEventToSRAOrder)(jsonMessage)];
                    this.orderUpdate(sraOrders);
                }
                catch (err) {
                    logger_1.logger.error('send websocket order update', { error: err });
                }
            },
        });
    }
    async destroyAsync() {
        clearInterval(this._pongIntervalId);
        for (const ws of this._server.clients) {
            ws.terminate();
        }
        this._requestIdToSocket.clear();
        this._requestIdToSubscriptionOpts.clear();
        this._server.close();
        for (const client of this._server.clients) {
            client.terminate();
        }
        if (this._orderEventsSubscription) {
            this._orderEventsSubscription.unsubscribe();
        }
    }
    orderUpdate(apiOrders) {
        if (this._server.clients.size === 0) {
            return;
        }
        const response = {
            type: types_1.OrdersChannelMessageTypes.Update,
            channel: types_1.MessageChannels.Orders,
            payload: apiOrders,
        };
        for (const order of apiOrders) {
            // Future optimisation is to invert this structure so the order isn't duplicated over many request ids
            // order->requestIds it is less likely to get multiple order updates and more likely
            // to have many subscribers and a single order
            const requestIdToOrders = {};
            for (const [requestId, subscriptionOpts] of this._requestIdToSubscriptionOpts) {
                if (WebsocketService._matchesOrdersChannelSubscription(order.order, subscriptionOpts)) {
                    if (requestIdToOrders[requestId]) {
                        const orderSet = requestIdToOrders[requestId];
                        orderSet.add(order);
                    }
                    else {
                        const orderSet = new Set();
                        orderSet.add(order);
                        requestIdToOrders[requestId] = orderSet;
                    }
                }
            }
            for (const [requestId, orders] of Object.entries(requestIdToOrders)) {
                const ws = this._requestIdToSocket.get(requestId);
                if (ws) {
                    ws.send(JSON.stringify({ ...response, payload: Array.from(orders), requestId }));
                }
            }
        }
    }
    _processConnection(ws, _req) {
        ws.on('pong', this._pongHandler(ws).bind(this));
        ws.on(types_1.WebsocketConnectionEventType.Message, this._messageHandler(ws).bind(this));
        ws.on(types_1.WebsocketConnectionEventType.Close, this._closeHandler(ws).bind(this));
        ws.isAlive = true;
        ws.requestIds = new Set();
    }
    _processMessage(ws, data) {
        let message;
        try {
            message = JSON.parse(data.toString());
        }
        catch (e) {
            throw new errors_1.MalformedJSONError();
        }
        schema_utils_1.schemaUtils.validateSchema(message, schemas_1.schemas.sraOrdersChannelSubscribeSchema);
        const { requestId, payload, type } = message;
        switch (type) {
            case types_1.MessageTypes.Subscribe: {
                ws.requestIds.add(requestId);
                const subscriptionOpts = payload === undefined || _.isEmpty(payload) ? 'ALL_SUBSCRIPTION_OPTS' : payload;
                this._requestIdToSubscriptionOpts.set(requestId, subscriptionOpts);
                this._requestIdToSocket.set(requestId, ws);
                break;
            }
            default:
                throw new errors_1.NotImplementedError(message.type);
        }
    }
    _cleanupConnections() {
        // Ping every connection and if it is unresponsive
        // terminate it during the next check
        for (const ws of this._server.clients) {
            if (!ws.isAlive) {
                ws.terminate();
            }
            else {
                ws.isAlive = false;
                ws.ping();
            }
        }
    }
    _messageHandler(ws) {
        return (data) => {
            try {
                this._processMessage(ws, data);
            }
            catch (err) {
                this._processError(ws, err);
            }
        };
    }
    _processError(ws, err) {
        const { errorBody } = error_handling_1.errorUtils.generateError(err);
        ws.send(JSON.stringify(errorBody));
        ws.terminate();
    }
    _pongHandler(ws) {
        return () => {
            ws.isAlive = true;
        };
    }
    _closeHandler(ws) {
        return () => {
            for (const requestId of ws.requestIds) {
                this._requestIdToSocket.delete(requestId);
                this._requestIdToSubscriptionOpts.delete(requestId);
            }
        };
    }
}
exports.WebsocketService = WebsocketService;
//# sourceMappingURL=websocket_service.js.map