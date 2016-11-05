'use strict';

export interface StrategyTransportInterface {
    name: string;
    parameters: any;
};

export class Strategy {
    public name: string;
    public returnValue: boolean;

    constructor (name: string, returnValue: boolean = false) {
        this.name = name || 'unknown';
        this.returnValue = returnValue;
    }

    isEnabled (parameters: any, context: any) : boolean {
        return this.returnValue;
    }
};

// export function Simple(parameters: any, context: any) : boolean {
//     return true;
// };
// Simple.prototype.name = 'simple-matcher';


export class CookieMatcher extends Strategy {
    constructor () {
        super('cookie-matcher');
    }

    isEnabled (parameters: any, context: any) : boolean {
        return this.returnValue;
    }
};

interface User {
    id: string,
};

export class UserMatcher extends Strategy {
    constructor () {
        super('user-matcher');
    }

    isEnabled (parameters: User, context: User) : boolean {
        for (var key in parameters) {
            if (parameters.hasOwnProperty(key)) {
                if (parameters[key] === ) {

                }
            }
        }
    }
};

export class GradualRolloutRandom extends Strategy {
    constructor () {
        super('gradual-rollout-random');
    }

    isEnabled (parameters: any, context: any) : boolean {
        return this.returnValue;
    }
};

export class ByHostName extends Strategy {
    constructor () {
        super('by-host-name');
    }

    isEnabled (parameters: any, context: any) : boolean {
        return this.returnValue;
    }
};

export class ByRemoteAddr extends Strategy {
    constructor () {
        super('by-remote-addr');
    }

    isEnabled (parameters: any, context: any) : boolean {
        return this.returnValue;
    }
};
