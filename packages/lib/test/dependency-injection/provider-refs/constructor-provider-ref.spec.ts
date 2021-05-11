import { MockClassProvider, EmptyClass1, symbol1  } from '../../shared';
import { ConstructorProviderRef } from '../../../src/internal/dependency-injection/provider-refs/constructor-provider-ref';

describe('ConstructorProviderRef[class]', () => {

    let classProvider: MockClassProvider;
    beforeEach(() => {
        classProvider = new MockClassProvider();
    });

    describe('constructor()', () => {

        it('Should set the injectToken', () => {

            expect(classProvider.providerRef().injectToken)
                .toBe(classProvider.constructorRef);

            expect(classProvider.updateToken(EmptyClass1).providerRef().injectToken)
                .toBe(EmptyClass1);

            expect(classProvider.updateToken('token').providerRef().injectToken)
                .toBe('token');

            expect(classProvider.updateToken(symbol1).providerRef().injectToken)
                .toBe(symbol1);

        });

    });

    describe('resolve()', () => {

        it('Should call the super injector with the the callstack', async () => {
            const spy = spyOn(ConstructorProviderRef.prototype, 'resolve');
            const ref = classProvider.providerRef();
            const callstack = [new MockClassProvider().constructorRef];
            await ref.resolve(callstack);
            expect(spy.calls.mostRecent().args[0]).toBe(callstack);
        });

        it('Should return the value from the injector when called for the first time when singleton', async () => {
            const instance = classProvider.createInstance();
            const ref = classProvider.providerRef();
            spyOn(ConstructorProviderRef.prototype, 'resolve').and.resolveTo(instance);
            expect(await ref.resolve()).toBe(instance);
        });

        it('Should not return a new class instance when called for the second time when singleton', async () => {
            const ref = classProvider.providerRef();
            const instance = await ref.resolve();
            expect(await ref.resolve()).toBe(instance);
        });

        it('Should return the value from the injector when called for the first time when not singleton', async () => {
            const instance = classProvider.setSingleton(false).createInstance();
            const ref = classProvider.providerRef();
            spyOn(ConstructorProviderRef.prototype, 'resolve').and.resolveTo(instance);
            expect(await ref.resolve()).toBe(instance);
        });

        it('Should return a new class instance when called for the second time when not singleton', async () => {
            const ref = classProvider.setSingleton(false).providerRef();
            const instance = await ref.resolve();
            expect(await ref.resolve()).not.toBe(instance);
        });

    });

});
