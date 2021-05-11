import { FactoryProviderRef } from '../../../src/internal/dependency-injection/provider-refs/factory-provider-ref';
import { MockFactoryProvider, symbol3, EmptyClass2 } from '../../shared';

describe('FactoryProviderRef[class]', () => {

    let factoryProvider: MockFactoryProvider;
    let ref: FactoryProviderRef;
    beforeEach(() => {
        factoryProvider = new MockFactoryProvider(symbol3, MockFactoryProvider.factoryFn2('Result'));
    });

    describe('constructor()', () => {
        it('Should set the injectToken', () => {
            ref = factoryProvider.providerRef();
            expect(ref.injectToken).toBe(symbol3);
        });
    });

    describe('resolve()', () => {

        it('Should resolve with the result of the factory function', async () => {
            ref = factoryProvider.providerRef();
            expect(await ref.resolve()).toEqual(await factoryProvider.execute());
        });

        it('Should wait for an async factory function', async () => {
            ref = factoryProvider.updateFactory(MockFactoryProvider.factoryFn1(100)).providerRef();
            expect(await ref.resolve()).toEqual(100);
        });

        it('Should only call the factory function once and thereafter return this value from the first factory function, when singleton', async () => {
            ref = factoryProvider.updateFactory(() => new EmptyClass2()).providerRef();
            const result = await ref.resolve();
            expect(await ref.resolve()).toBe(result);
        });

        it('Should call the factory function each time when not singleton', async () => {
            ref = factoryProvider
                .updateFactory(() => new EmptyClass2())
                .setSingleton(false)
                .providerRef();
            const result = await ref.resolve();
            expect(await ref.resolve()).not.toBe(result);
        });


    });


});
