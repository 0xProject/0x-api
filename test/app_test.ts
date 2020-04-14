import { APIOrder, PaginatedCollection } from '@0x/connect';
import * as HttpStatus from 'http-status-codes';
import * as request from 'supertest';

import { DEFAULT_PAGE, DEFAULT_PER_PAGE, SRA_PATH } from '../src/constants';

import { expect } from './utils/expect';
import { TestCase, TestManager } from './utils/test_manager';

const API_HTTP_ADDRESS = 'http://localhost:3000';

async function apiGetRequestAsync(url: string): Promise<request.Response> {
    return request(API_HTTP_ADDRESS).get(url);
}

async function assertCorrectGetBodyAsync(
    expectedBody: PaginatedCollection<APIOrder>,
    actualResponse: request.Response,
): Promise<boolean> {
    expect(actualResponse.type).to.match(/json/);
    expect(actualResponse.status).to.be.eq(HttpStatus.OK);
    expect(actualResponse.body).to.be.deep.eq(expectedBody);
    return true;
}

const manager = new TestManager(
    {
        apiGetRequestAsync,
    },
    {
        assertCorrectGetBodyAsync,
    },
);

const suite: TestCase[] = [
    {
        description: 'should respond to GET /sra/orders',
        action: {
            actionType: 'apiGetRequestAsync',
            input: `${SRA_PATH}/orders`,
        },
        assertion: {
            assertionType: 'assertCorrectGetBodyAsync',
            // This is the body of the expected HTTP request.
            input: {
                perPage: DEFAULT_PER_PAGE,
                page: DEFAULT_PAGE,
                total: 0,
                records: [],
            },
        },
    },
];
manager.executeTestSuite('app test', suite);
