import { createHash } from 'crypto';

/**
 * A function that allows for gradual, consistent rollouts of features
 *
 * Given a message, and a target rollout threshold  (between 0 and 1), returns a boolean of whether
 * the message should get the rolled out treatment or not.
 *
 * This method has the property that the same message will always recieve the same treatment, even as
 * the threshold is increased over time.
 */
export const isRolledOut = ({ message, threshold }: { message: string; threshold: number }): boolean => {
    // If we are targeting a 100% rollout, short circuit and return true
    if (threshold >= 1) {
        return true;
    }

    // Generate the hash from the message
    const hash = createHash('sha1').update(message).digest('hex');

    // Grab the first byte
    const firstByte = hash.substring(0, 2);

    // Represent the threshold as a byte: convert the value [0, 1) to the range [0, 255], but as hex: [00, ff]
    // tslint:disable-next-line: custom-no-magic-numbers
    const thresholdByte = Math.floor(Math.min(threshold, 1) * 256).toString(16);

    // Compare
    return firstByte < thresholdByte;
};
