import 'mocha';

import { LoggingConfig, setupApiAsync, teardownApiAsync } from './deployment';

// FIXME(jalextowle): Lock this down to only the actions that have been created.
export type ActionType = string;

// FIXME(jalextowle): Lock this down to only the assetions that have been created.
//                    The TestManager should remain flexible, but not when it is
//                    being used normally.
export type AssertionType = string;

// tslint:disable-next-line:interface-over-type-literal
export type ActionResult = any;

export interface ActionInfo {
    actionType: ActionType;
    // FIXME(jalextowle): Lock this down to only the actions that have been created.
    input: any;
}

export interface AssertionInfo {
    assertionType: AssertionType;
    input: any;
}

export interface TestCase {
    description: string;
    action: ActionInfo;
    assertions: AssertionInfo[];
}

type Action = (input: any) => Promise<any>;
type Assertion = (expectedResult: ActionResult, actualResult: ActionResult) => Promise<void>;

export class TestManager {
    constructor(
        protected _actionsAsync: Record<string, Action>,
        protected _assertionsAsync: Record<string, Assertion>,
        protected readonly _loggingConfig?: LoggingConfig,
    ) {}

    /**
     * NOTE(jalextowle): This function cannot be called from an `async` function.
     *                   This will lead to undefined behavior and is a limitation
     *                   of Mocha. Source: https://github.com/mochajs/mocha/issues/3347
     * Executes a test suite defined by the appropriate data structure.
     * @param description A meaningful description of the test suite's purpose.
     * @param testSuite The set of test cases that should be executed (in order)
     *        in this suite.
     */
    public executeTestSuite(description: string, testSuite: TestCase[]): void {
        if (!testSuite.length) {
            throw new Error(`[test-manager] suite '${description}' is empty`);
        }

        // Execute each of the test cases.
        describe(description, () => {
            beforeEach(async () => {
                // Setup the 0x-api instance.
                await setupApiAsync(this._loggingConfig);
            });

            afterEach(async () => {
                // Teardown the 0x-api instance.
                await teardownApiAsync(this._loggingConfig);
            });

            for (const testCase of testSuite) {
                it(testCase.description, async () => {
                    await this._executeTestCaseAsync(testCase);
                });
            }
        });
    }

    protected async _executeTestCaseAsync(testCase: TestCase): Promise<void> {
        const actionResult = await this._executeActionAsync(testCase.action);
        for (const assertion of testCase.assertions) {
            await this._executeAssertionAsync(assertion, actionResult);
        }
    }

    protected async _executeActionAsync(action: ActionInfo): Promise<ActionResult> {
        const actionAsync = this._actionsAsync[action.actionType];
        if (!actionAsync) {
            throw new Error('[test-manager] action is not registered');
        }
        return actionAsync(action.input);
    }

    protected async _executeAssertionAsync(assertion: AssertionInfo, actualResult: ActionResult): Promise<void> {
        const assertionAsync = this._assertionsAsync[assertion.assertionType];
        if (!assertionAsync) {
            throw new Error('[test-manager] assertion is not registered');
        }
        return assertionAsync(assertion.input, actualResult);
    }
}
