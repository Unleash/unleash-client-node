import test from 'ava';
import resolveTimerUtils from '../../lib/integrations/timer-utils';

// Mini mock library
const mockFn = () => {
    const mockFnInstance = (...args) => {
        mockFnInstance.lastCalledArguments = [...args];
        return mockFnInstance.returnValue;
    };

    mockFnInstance.mockReturnValue = returnValue => (mockFnInstance.returnValue = returnValue);
    return mockFnInstance;
};

const expect = (t, mock) => ({
    toHaveBeenCalledWith: (...expectedArgs) => {
        t.deepEqual(mock.lastCalledArguments, [...expectedArgs]);
    },
});
// //////////////////

let windowObj;

test.beforeEach(() => {
    global.navigator = { product: 'fake-browser' };
    global.window = {
        setTimeout: mockFn(),
        clearInterval: mockFn(),
    };
    global.document = {};
    windowObj = global.window;
});

test('should able to set timeouts', t => {
    const timerUtils = resolveTimerUtils();
    const someCallBackFn = () => {};
    const timeoutInMs = 100;
    const arg1 = 'pi';
    const arg2 = 2.33;

    timerUtils.setTimeout(someCallBackFn, timeoutInMs, arg1, arg2);

    expect(t, windowObj.setTimeout).toHaveBeenCalledWith(someCallBackFn, timeoutInMs, arg1, arg2);
});

test('should able to set and clear timeouts', t => {
    const timerUtils = resolveTimerUtils();
    const handle = 27;
    const someCallBackFn = () => {};
    windowObj.setTimeout.mockReturnValue(handle);

    const timeout = timerUtils.setTimeout(someCallBackFn, 100);
    timerUtils.clearInterval(timeout);

    expect(t, windowObj.clearInterval).toHaveBeenCalledWith(handle);
});
