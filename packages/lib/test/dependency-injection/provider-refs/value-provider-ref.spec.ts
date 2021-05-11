import { MockValueProvider, symbol4 } from '../../shared';

describe('ValueProviderRef[class]', () => {

    let valueProvider: MockValueProvider;
    const value = {
        prop1: {
            prop2: ['1', '5', '7'],
        },
        prop3: ['10', '15', '27']
    };
    beforeEach(() => {
        valueProvider = new MockValueProvider(symbol4, value);
    });

    describe('constructor()', () => {

        it('Should set the injectToken', () => {
            const ref = valueProvider.providerRef();
            expect(ref.injectToken).toEqual(symbol4);
        });

    });

    describe('resolve()', () => {

        it('When singleton it should return the value provided in the constructor', async () => {
            const ref = valueProvider.providerRef();
            expect(await ref.resolve()).toBe(value);
        });

        it('Should return a deeply immuttable value when not singleton', async () => {
            const result = await valueProvider.setSingleton(false).providerRef().resolve();
            expect(result).toEqual(value);
            expect(result).not.toBe(value);
            expect(result.prop1).not.toBe(value.prop1);
            expect(result.prop1.prop2).not.toBe(value.prop1.prop2);
            expect(result.prop3).not.toBe(value.prop3);
        });

    });

});
