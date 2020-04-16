import * as HttpStatus from 'http-status-codes';

import { DEFAULT_PAGE, DEFAULT_PER_PAGE, SRA_PATH } from '../src/constants';

import { STRICT_ACTIONS, STRICT_ASSERTIONS, StrictTestCaseType, strictTestManager } from './framework/strict_utils';

const manager = strictTestManager();
const suite: StrictTestCaseType[] = [
    {
        description: 'should respond to GET /sra/orders',
        action: {
            actionType: STRICT_ACTIONS.HTTP_GET,
            input: {
                route: `${SRA_PATH}/orders`,
            },
        },
        assertions: [
            {
                assertionType: STRICT_ASSERTIONS.EQUALS,
                input: {
                    field: 'status',
                    value: HttpStatus.OK,
                },
            },
            {
                assertionType: STRICT_ASSERTIONS.EQUALS,
                input: {
                    field: 'type',
                    value: /json/,
                },
            },
            {
                assertionType: STRICT_ASSERTIONS.EQUALS,
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
