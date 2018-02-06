import { FeatureInterface } from './feature';

export interface FeaturesBase {
    features: FeatureInterface[];
}

export interface Features extends FeaturesBase {
    version: number;
    features: FeatureInterface[];
}

export function toNewFormat(data: any): Features {
    return {
        version: 1,
        features: data.features.map((feature: any): FeatureInterface => {
            const copied: FeatureInterface = Object.assign({}, feature);
            if (!feature.strategies && feature.strategy) {
                copied.strategies = [{ name: feature.strategy, parameters: feature.parameters }];
                return copied;
            }
            return copied;
        }),
    };
}

export function pickData(serverData: any): FeaturesBase {
    const features: FeatureInterface[] = serverData.features;
    return {
        features: features.map(({ name, enabled, strategies, variants }) => ({
            name,
            enabled,
            strategies,
            variants,
        })),
    };
}
