import * as HttpStatus from 'http-status-codes';

import { DEFAULT_PAGE, DEFAULT_PER_PAGE, SRA_PATH } from '../src/constants';

import { ACTIONS, ASSERTIONS, createTestManager, TestCaseType } from './framework';

const manager = createTestManager();
const suite: TestCaseType[] = [
    {
        description: 'should respond to GET /sra/orders',
        action: {
            actionType: ACTIONS.HTTP_GET,
            input: {
                route: `${SRA_PATH}/orders`,
            },
        },
        assertions: [
            {
                assertionType: ASSERTIONS.EQUALS,
                input: {
                    path: 'status',
                    value: HttpStatus.OK,
                },
            },
            {
                assertionType: ASSERTIONS.MATCHES,
                input: {
                    path: 'type',
                    value: /json/,
                },
            },
            {
                assertionType: ASSERTIONS.EQUALS,
                input: {
                    path: 'body',
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
