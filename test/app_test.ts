import * as HttpStatus from 'http-status-codes';
import * as request from 'supertest';

import { DEFAULT_PAGE, DEFAULT_PER_PAGE, SRA_PATH } from '../src/constants';

import { expect } from './utils/expect';
import { TestCase, TestManager } from './utils/test_manager';

const API_HTTP_ADDRESS = 'http://localhost:3000';

async function apiGetRequestAsync(url: string): Promise<request.Response> {
    return request(API_HTTP_ADDRESS).get(url);
}

async function assertResponseContentTypeAsync(
    expectedContentRegex: RegExp,
    actualResponse: request.Response,
): Promise<void> {
    expect(actualResponse.type).to.match(expectedContentRegex);
}

async function assertResponseStatusAsync(expectedCode: number, actualResponse: request.Response): Promise<void> {
    expect(actualResponse.status).to.be.eq(expectedCode);
}

async function assertResponseBodyAsync(expectedBody: string, actualResponse: request.Response): Promise<void> {
    expect(actualResponse.body).to.be.deep.eq(expectedBody);
}

const manager = new TestManager(
    {
        apiGetRequestAsync,
    },
    {
        assertResponseBodyAsync,
        assertResponseStatusAsync,
        assertResponseContentTypeAsync,
    },
);
const suite: TestCase[] = [
    {
        description: 'should respond to GET /sra/orders',
        action: {
            actionType: 'apiGetRequestAsync',
            input: `${SRA_PATH}/orders`,
        },
        assertions: [
            {
                assertionType: 'assertResponseStatusAsync',
                input: HttpStatus.OK,
            },
            {
                assertionType: 'assertResponseContentTypeAsync',
                input: /json/,
            },
            {
                assertionType: 'assertResponseBodyAsync',
                input: {
                    perPage: DEFAULT_PER_PAGE,
                    page: DEFAULT_PAGE,
                    total: 0,
                    records: [],
                },
            },
        ],
    },
];
manager.executeTestSuite('app test', suite);
