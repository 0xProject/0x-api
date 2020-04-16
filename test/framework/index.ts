import * as actions from './actions';
import * as assertions from './assertions';
import { TestCase, TestManager } from './test_manager';

export const ACTIONS = {
    HTTP_GET: 'httpGetAsync' as ActionType,
};

export const ASSERTIONS = {
    EQUALS: 'assertEqualsAsync' as AssertionType,
    MATCHES: 'assertMatchesAsync' as AssertionType,
};

export type ActionType = 'httpGetAsync';
export type AssertionType = 'assertEqualsAsync' | 'assertMatchesAsync';
export type TestCaseType = TestCase<ActionType, AssertionType>;

/**
 * Constructs the default `TestManager` class, which uses strict type declarations
 * to improve DevEx.
 * @returns TestManager Returns a `TestManager` that has been given default actions
 *          and assertions.
 */
export function createTestManager(): TestManager<ActionType, AssertionType> {
    return new TestManager(
        {
            httpGetAsync: actions.httpGetAsync,
        },
        {
            assertEqualsAsync: assertions.assertEqualsAsync,
            assertMatchesAsync: assertions.assertMatchesAsync,
        },
    );
}
