import { isStandardBrowserEnv } from "./browser-detector";
import { browserBasedClearInterval, browserBasedSetTimeout } from './browser/browser-based-timer-utils';
import { nodeBasedClearInterval, nodeBasedSetTimeout } from './node/node-based-timer-utils';


const BrowserBasedTimerUtils = { setTimeout: browserBasedSetTimeout, clearInterval: browserBasedClearInterval };
const NodeBasedTimerUtils = { setTimeout: nodeBasedSetTimeout, clearInterval: nodeBasedClearInterval };

const resolve = () => isStandardBrowserEnv() ? BrowserBasedTimerUtils : NodeBasedTimerUtils;

export default resolve;
