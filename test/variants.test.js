import test from 'ava';
import { selectVariant } from '../lib/variant';

function genVariants(n) {
    return Array.from(new Array(n)).map((v, i) => ({
        name: `variant${i + 1}`,
        payload: {
            type: 'string',
            value: '',
        },
        weight: 1,
    }));
}

function createFeature(variants) {
    return {
        name: 'toggleName',
        enabled: true,
        strategies: [],
        variants: variants || [],
    };
}

test('selectVariant should return null', t => {
    const variant = selectVariant(createFeature(), {
        toggleName: 'toggleName',
        userId: 'a',
    });
    t.true(variant === null);
});

test('selectVariant should select on 1 variant', t => {
    const variant = selectVariant(createFeature(genVariants(1)), {
        toggleName: 'toggleName',
        userId: 'a',
    });
    t.true(variant.name === 'variant1');
});

test('selectVariant should select on 2 variants', t => {
    const feature = createFeature(genVariants(2));
    const variant = selectVariant(feature, { toggleName: 'toggleName', userId: 'a' });
    t.true(variant.name === 'variant1');
    const variant2 = selectVariant(feature, { toggleName: 'toggleName', userId: '0' });
    t.true(variant2.name === 'variant2');
});

test('selectVariant should select on 3 variants', t => {
    const feature = createFeature(genVariants(3));
    const variant = selectVariant(feature, { toggleName: 'toggleName', userId: 'a' });
    t.true(variant.name === 'variant1');
    const variant2 = selectVariant(feature, { toggleName: 'toggleName', userId: '0' });
    t.true(variant2.name === 'variant2');
    const variant3 = selectVariant(feature, { toggleName: 'toggleName', userId: 'z' });
    t.true(variant3.name === 'variant3');
});

test('selectVariant should use variant overrides', t => {
    const variants = genVariants(3);
    variants[0].overrides = [
        {
            field: 'userId',
            values: ['z'],
        },
    ];

    const feature = createFeature(variants);
    const variant1 = selectVariant(feature, { toggleName: 'toggleName', userId: 'z' });
    t.is(variant1.name, 'variant1');
});

test('selectVariant should use *first* variant override', t => {
    const variants = genVariants(3);
    variants[0].overrides = [
        {
            field: 'userId',
            values: ['z', 'b'],
        },
    ];

    variants[1].overrides = [
        {
            field: 'userId',
            values: ['z'],
        },
    ];

    const feature = createFeature(variants);
    const variant1 = selectVariant(feature, { toggleName: 'toggleName', userId: 'z' });
    t.is(variant1.name, 'variant1');
});
