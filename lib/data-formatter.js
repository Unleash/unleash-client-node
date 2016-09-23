'use strict';

exports.toNewFormat = function toNewFormat (data) {
    return {
        version: 1,
        features: data.features.map((feature) => {
            const copied = Object.assign({}, feature);
            if (!feature.strategies) {
                copied.strategies = [{ name: feature.strategy, parameters: feature.parameters }];
                return copied;
            }
            return copied;
        }),
    };
};


exports.pickData = function pickData (serverData) {
    return {
        features: serverData.features.map(({ name, enabled, strategies }) => ({ name, enabled, strategies })),
    };
};
