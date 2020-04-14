import { TestCase, TestManager } from './utils/test_manager';

const sleepActionAsync = async (time: number) => {
    return new Promise<void>(resolve => {
        setTimeout(resolve, time);
    });
};
const manager = new TestManager(
    {
        sleep: sleepActionAsync,
    },
    {
        nothing: () => true,
    },
);
const suite: TestCase[] = [
    {
        description: 'sleep for 5s',
        action: {
            actionType: 'sleep',
            input: 5000,
        },
        assertion: {
            assertionType: 'nothing',
            expectedResult: {},
        },
    },
];
manager.executeTestSuite('sleep assertion', suite);
