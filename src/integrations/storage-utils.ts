import { isStandardBrowserEnv } from "./browser-detector";
import * as NodeBasedStorageUtils from './node/node-based-storage-utils';
import * as BrowserBasedStorageUtils from './browser/browser-based-storage-utils';

const resolve = () => isStandardBrowserEnv() ? BrowserBasedStorageUtils : NodeBasedStorageUtils;

export default resolve;
