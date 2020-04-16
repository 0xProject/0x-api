import * as actions from './actions';
import * as assertions from './assertions';
import { TestCase, TestManager } from './test_manager';

export const STRICT_ACTIONS = {
    HTTP_GET: 'httpGetAsync' as StrictActionType,
};

export const STRICT_ASSERTIONS = {
    EQUALS: 'assertEqualsAsync' as StrictAssertionType,
};

export type StrictActionType = 'httpGetAsync';
export type StrictAssertionType = 'assertEqualsAsync';
export type StrictTestCaseType = TestCase<StrictActionType, StrictAssertionType>;

/**
 * Constructs the default `TestManager` class, which uses strict type declarations
 * to improve DevEx.
 * @returns TestManager Returns a `TestManager` that has been given default actions
 *          and assertions.
 */
export function strictTestManager(): TestManager<StrictActionType, StrictAssertionType> {
    return new TestManager(
        {
            httpGetAsync: actions.httpGetAsync,
        },
        {
            assertEqualsAsync: assertions.assertEqualsAsync,
        },
    );
}
