import * as HttpStatus from 'http-status-codes';

import { DEFAULT_PAGE, DEFAULT_PER_PAGE, SRA_PATH } from '../src/constants';

import { defaultTestManager, TestCase } from './framework/test_manager';

const manager = defaultTestManager();
const suite: TestCase[] = [
    {
        description: 'should respond to GET /sra/orders',
        action: {
            actionType: 'apiGetRequestAsync',
            input: {
                route: `${SRA_PATH}/orders`,
            },
        },
        assertions: [
            {
                assertionType: 'assertFieldEqualsAsync',
                input: {
                    field: 'status',
                    value: HttpStatus.OK,
                },
            },
            {
                assertionType: 'assertFieldEqualsAsync',
                input: {
                    field: 'type',
                    value: /json/,
                },
            },
            {
                assertionType: 'assertFieldEqualsAsync',
                input: {
                    field: 'body',
                    value: {
                        perPage: DEFAULT_PER_PAGE,
                        page: DEFAULT_PAGE,
                        total: 0,
                        records: [],
                    },
                },
            },
        ],
    },
];
manager.executeTestSuite('app test', suite);
