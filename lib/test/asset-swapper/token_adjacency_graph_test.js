"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
require("mocha");
const token_adjacency_graph_1 = require("../../src/asset-swapper/utils/token_adjacency_graph");
const chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
describe('TokenAdjacencyGraphBuilder and TokenAdjacencyGraph', () => {
    describe('constructor', () => {
        it('sanitizes passed default tokens to lower case', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder(['DEFAULT_1', 'DEFAULT_2']).build();
            expect(graph.getAdjacentTokens('random_token')).to.deep.eq(['default_1', 'default_2']);
        });
    });
    describe('add', () => {
        it('adds a new token path to the graph', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder(['default_1', 'default_2']).add('token_a', 'token_b').build();
            expect(graph.getAdjacentTokens('token_a')).to.deep.eq(['default_1', 'default_2', 'token_b']);
        });
        it('adds lower-cased token path to the graph', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder(['default_1', 'default_2']).add('TOKEN_A', 'TOKEN_B').build();
            expect(graph.getAdjacentTokens('token_a')).to.deep.eq(['default_1', 'default_2', 'token_b']);
        });
        it('ignores an existing to token', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder().add('token_a', 'token_b').add('token_a', 'token_b').build();
            expect(graph.getAdjacentTokens('token_a')).to.deep.eq(['token_b']);
        });
    });
    describe('addBidirectional', () => {
        it('adds a bidirectional path to the graph', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder(['default_1']).addBidirectional('token_a', 'token_b').build();
            expect(graph.getAdjacentTokens('token_a')).to.deep.eq(['default_1', 'token_b']);
            expect(graph.getAdjacentTokens('token_b')).to.deep.eq(['default_1', 'token_a']);
        });
    });
    describe('addCompleteSubgraph', () => {
        it('adds a complete subgraph to the graph', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder(['default_1'])
                .addCompleteSubgraph(['token_a', 'token_b', 'token_c', 'token_d'])
                .build();
            expect(graph.getAdjacentTokens('token_a')).to.deep.eq(['default_1', 'token_b', 'token_c', 'token_d']);
            expect(graph.getAdjacentTokens('token_b')).to.deep.eq(['default_1', 'token_a', 'token_c', 'token_d']);
            expect(graph.getAdjacentTokens('token_c')).to.deep.eq(['default_1', 'token_a', 'token_b', 'token_d']);
            expect(graph.getAdjacentTokens('token_d')).to.deep.eq(['default_1', 'token_a', 'token_b', 'token_c']);
        });
    });
    describe('tap', () => {
        it('applies callback correctly', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder(['default_1'])
                .tap((g) => {
                g.add('token_a', 'token_b');
                g.add('token_c', 'token_d');
            })
                .build();
            expect(graph.getAdjacentTokens('token_a')).to.deep.eq(['default_1', 'token_b']);
            expect(graph.getAdjacentTokens('token_c')).to.deep.eq(['default_1', 'token_d']);
        });
    });
    describe('getIntermediateTokens', () => {
        it('returns intermediate tokens without a duplicate ', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder(['default_1'])
                .add('token_a', 'token_b')
                .add('token_c', 'token_b')
                .build();
            expect(graph.getIntermediateTokens('token_a', 'token_c')).to.deep.eq(['default_1', 'token_b']);
        });
        it('returns intermediate tokens after lower-casing taker and maker tokens', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder(['default_1'])
                .add('token_a', 'token_b')
                .add('token_c', 'token_d')
                .build();
            expect(graph.getIntermediateTokens('TOKEN_a', 'token_C')).to.deep.eq(['default_1', 'token_b', 'token_d']);
        });
        it('returns intermediate tokens excluding taker token or maker token ', async () => {
            const graph = new token_adjacency_graph_1.TokenAdjacencyGraphBuilder(['default_1'])
                .addBidirectional('token_a', 'token_b')
                .addBidirectional('token_b', 'token_c')
                .addBidirectional('token_c', 'token_a')
                .build();
            expect(graph.getIntermediateTokens('token_a', 'token_c')).to.deep.eq(['default_1', 'token_b']);
        });
    });
});
//# sourceMappingURL=token_adjacency_graph_test.js.map