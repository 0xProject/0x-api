import { expect } from '../utils/expect';

/**
 * Asserts that a specified field of the actual result is equal to an expected value.
 * @param actual The result of the previous action.
 * @param input Specifies both the field and the expected value of the field that
 *        should be compared with the actual result.
 */
export async function assertFieldEqualsAsync(
    actual: any,
    input: {
        field: string;
        value: any;
    },
): Promise<void> {
    expect(actual[input.field]).to.be.deep.eq(input.value);
}
