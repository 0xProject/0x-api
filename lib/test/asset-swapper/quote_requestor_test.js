"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_utils_1 = require("@0x/protocol-utils");
const chai = require("chai");
require("mocha");
const quote_requestor_1 = require("../../src/asset-swapper/utils/quote_requestor");
const chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
const expect = chai.expect;
describe('QuoteRequestor', async () => {
    const validSignature = { v: 28, r: '0x', s: '0x', signatureType: protocol_utils_1.SignatureType.EthSign };
    it('sets and gets the makerUri by signature', () => {
        // Given
        const quoteRequestor = new quote_requestor_1.QuoteRequestor();
        // When
        quoteRequestor.setMakerUriForSignature(validSignature, 'makerUri');
        // Then
        expect(quoteRequestor.getMakerUriForSignature(validSignature)).to.eq('makerUri');
    });
});
//# sourceMappingURL=quote_requestor_test.js.map