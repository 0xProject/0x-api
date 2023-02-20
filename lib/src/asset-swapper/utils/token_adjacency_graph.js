"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenAdjacencyGraphBuilder = exports.TokenAdjacencyGraph = void 0;
const _ = require("lodash");
class TokenAdjacencyGraph {
    /** Prefer using {@link TokenAdjacencyGraphBuilder}. */
    constructor(graph, defaultTokens) {
        this._graph = graph;
        this._defaultTokens = defaultTokens;
    }
    static getEmptyGraph() {
        return new TokenAdjacencyGraphBuilder().build();
    }
    getAdjacentTokens(fromToken) {
        return this._graph.get(fromToken.toLowerCase()) || this._defaultTokens;
    }
    /** Given a token pair, returns the intermediate tokens to consider for two-hop routes. */
    getIntermediateTokens(takerToken, makerToken) {
        // NOTE: it seems it should be a union of `to` tokens of `takerToken` and `from` tokens of `makerToken`,
        // leaving it as same as the initial implementation for now.
        return _.union(this.getAdjacentTokens(takerToken), this.getAdjacentTokens(makerToken)).filter((token) => token !== takerToken.toLowerCase() && token !== makerToken.toLowerCase());
    }
}
exports.TokenAdjacencyGraph = TokenAdjacencyGraph;
class TokenAdjacencyGraphBuilder {
    constructor(defaultTokens = []) {
        this._graph = new Map();
        this._defaultTokens = defaultTokens.map((addr) => addr.toLowerCase());
    }
    add(fromToken, toToken) {
        const fromLower = fromToken.toLowerCase();
        const toLower = toToken.toLowerCase();
        if (fromLower === toLower) {
            throw new Error(`from token (${fromToken}) must be different from to token (${toToken})`);
        }
        if (!this._graph.has(fromLower)) {
            this._graph.set(fromLower, [...this._defaultTokens]);
        }
        // `fromLower` must present
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const toTokens = this._graph.get(fromLower);
        if (!toTokens.includes(toLower)) {
            toTokens.push(toLower);
        }
        return this;
    }
    addBidirectional(tokenA, tokenB) {
        return this.add(tokenA, tokenB).add(tokenB, tokenA);
    }
    addCompleteSubgraph(tokens) {
        for (let i = 0; i < tokens.length; i++) {
            for (let j = i + 1; j < tokens.length; j++) {
                this.addBidirectional(tokens[i], tokens[j]);
            }
        }
        return this;
    }
    tap(cb) {
        cb(this);
        return this;
    }
    build() {
        return new TokenAdjacencyGraph(this._graph, this._defaultTokens);
    }
}
exports.TokenAdjacencyGraphBuilder = TokenAdjacencyGraphBuilder;
//# sourceMappingURL=token_adjacency_graph.js.map