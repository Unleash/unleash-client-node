import * as NodeBasedStorageUtils from './node/node-based-storage-utils';
import * as BrowserBasedStorageUtils from './browser/browser-based-storage-utils';

const isStandardBrowserEnv = () => {
    if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
        navigator.product === 'NativeScript' ||
        navigator.product === 'NS')) {
        return false;
    }
    return (typeof window !== 'undefined' && typeof document !== 'undefined');
};


const resolve = () => isStandardBrowserEnv() ? BrowserBasedStorageUtils : NodeBasedStorageUtils;

export default resolve;
