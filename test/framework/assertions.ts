import { expect } from '../utils/expect';

/**
 * Asserts that a specified path of the actual result is equal to an expected value.
 * @param actual The result of the previous action.
 * @param input Specifies both the path and the expected value of the path that
 *        should be compared with the actual result. If the path is empty, this
 *        function will compare the full `actual` object to `input.value`.
 */
export async function assertEqualsAsync(
    actual: any,
    input: {
        path?: string;
        value: any;
    },
): Promise<void> {
    const actual_ = input.path ? actual[input.path] : actual;
    expect(actual_).to.be.deep.eq(input.value);
}

/**
 * Asserts that a specified field of the actual result is equal to an expected value.
 * @param actual The result of the previous action.
 * @param input Specifies both the path and the expected value of the path that
 *        should be compared with the actual result. If the path is empty, this
 *        function will compare the full `actual` object to `input.value`.
 */
export async function assertMatchesAsync(
    actual: any,
    input: {
        path?: string;
        value: RegExp;
    },
): Promise<void> {
    const actual_ = input.path ? actual[input.path] : actual;
    expect(actual_).to.match(input.value);
}
