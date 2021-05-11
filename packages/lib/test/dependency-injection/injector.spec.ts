
import { MockInjectable, symbol1, MockValueProvider, symbol2, MockClassProvider, MockFactoryProvider, MockRegistery, asyncThrowsError } from './../shared';
import { Inject } from '../../src';
import { ValueProviderRef } from '../../src/internal/dependency-injection/provider-refs/value-provider-ref';
import { GlobalComponentsRegistry } from '../../src/internal/app/global-components-registry';
import { Injector } from '../../src/internal/dependency-injection/injector';
import { Type } from '../../src/internal/common/cli-types';
import { ProviderRef } from '../../src/internal/dependency-injection/provider-refs/provider-ref';

describe('Injector[class]', () => {

    describe('resolve()', () => {
        class MockClassWithoutArgs {
        }

        let injectable: MockInjectable;
        let registry: GlobalComponentsRegistry;
        let injector: Injector;
        let parentInjector: Injector;
        beforeEach(() => {
            registry = new MockRegistery().registry;
            injectable = new MockInjectable();
        });

        const createInjector = (cls?: Type<any>, parentProviders?: ProviderRef[]) => {
            if (parentProviders) {
                parentInjector = new Injector(new MockClassProvider().constructorRef, registry.providers);
                parentInjector.providers = parentProviders;
            }
            injector = new Injector(cls || injectable.applyMetadata().constructorRef, registry.providers, parentInjector);
        };

        const createInjectorWithProviders = (cls: Type<any>, providers: ProviderRef[], parentProviders?: ProviderRef[]) => {
            if (parentProviders) {
                parentInjector = new Injector(new MockClassProvider().constructorRef, registry.providers);
                parentInjector.providers = parentProviders;
            }
            injector = new Injector(cls || injectable.applyMetadata().constructorRef, registry.providers, parentInjector);
            injector.providers = providers;
        };

        it('Should throw and error when it recieves a constructor with arguments but no injectable metadata decorators', async () => {
            class MockClassWithArgs {
                constructor(value: string) { }
            }
            createInjector(MockClassWithArgs);
            expect(await asyncThrowsError(() => injector.resolve([]))).toBeTrue();
        });

        it('Should return a new instance of a constructor if it has no arguments', async () => {
            createInjector(MockClassWithoutArgs);
            expect(await injector.resolve([]) instanceof MockClassWithoutArgs).toBeTrue();
        });

        it('Should not throw an error if no callstack agrument is provided', async () => {
            createInjector(MockClassWithoutArgs);
            expect(await asyncThrowsError(() => injector.resolve([]))).toBeFalse();
        });

        it('Should throw an error if not all of the constructor arguments have metadata', async () => {
            class MockClassWithPartialInjectors {
                constructor(
                    @Inject(symbol1) private dep1: any,
                    private dep2: string
                ) { }
            }
            createInjectorWithProviders(MockClassWithPartialInjectors, [new MockValueProvider(symbol1, null).providerRef()]);
            expect(await asyncThrowsError(async () => injector.resolve())).toBeTruthy();
        });

        it('Should throw an error if a provider cannot be found for an argument\'s injectToken', async () => {
            injectable
                .addConstructorParam(new MockClassProvider())
                .addConstructorParam(new MockClassProvider())
                .applyMetadata();
            createInjectorWithProviders(injectable.constructorRef, injectable.injectableProviderRefs.slice(0, 1));
            expect(await asyncThrowsError(async () => injector.resolve())).toBeTruthy();
        });


        it('Should call the resolve function of each provider with the callstack which also has its own constructor appended', async () => {

            injectable
                .addConstructorParam(new MockClassProvider())
                .addConstructorParam(new MockFactoryProvider(symbol1, () => null))
                .addConstructorParam(new MockFactoryProvider(symbol2, () => null))
                .applyMetadata();

            createInjectorWithProviders(injectable.constructorRef, injectable.injectableProviderRefs);
            const spy1 = spyOn(injector.providers[0], 'resolve');
            const spy2 = spyOn(injector.providers[1], 'resolve');
            const spy3 = spyOn(injector.providers[2], 'resolve');
            const callstack = [new MockClassProvider().constructorRef];

            await injector.resolve(callstack);
            expect(spy1.calls.mostRecent().args[0]).toEqual([...callstack, injector.constructorRef]);
            expect(spy2.calls.mostRecent().args[0]).toEqual([...callstack, injector.constructorRef]);
            expect(spy3.calls.mostRecent().args[0]).toEqual([...callstack, injector.constructorRef]);
        });

        it('Should throw an error for circular dependencies if the provider has already been resolved in the call stack', async () => {
            injectable
                .addConstructorParam(new MockClassProvider())
                .addConstructorParam(new MockFactoryProvider(symbol1, () => null))
                .addConstructorParam(new MockFactoryProvider(symbol2, () => null))
                .applyMetadata();
            createInjectorWithProviders(injectable.constructorRef, injectable.injectableProviderRefs);
            const callstack = [injector.providers[0].injectToken];
            expect(await asyncThrowsError(() => injector.resolve(callstack))).toBe(true);
        });

        it('Should look in the parent injector scope to resolve providers', () => {
            injectable
                .addConstructorParam(new MockClassProvider())
                .applyMetadata();
            createInjectorWithProviders(injectable.constructorRef, [], injectable.injectableProviderRefs);
            const spy = spyOn(parentInjector.providers[0], 'resolve');
            injector.resolve();
            expect(spy).toHaveBeenCalled();
        });

        it('The local injector scope should take preference over parents', () => {
            injectable
                .addConstructorParam(new MockClassProvider().updateToken(symbol1))
                .applyMetadata();
            createInjectorWithProviders(injectable.constructorRef, injectable.injectableProviderRefs, [new MockClassProvider().updateToken(symbol1).providerRef()]);
            const parentSpy = spyOn(parentInjector.providers[0], 'resolve');
            const spy = spyOn(injector.providers[0], 'resolve');
            injector.resolve();
            expect(parentSpy).not.toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });

        it('Should look in the global injection scope to resolve providers', () => {
            injectable
                .addConstructorParam(new MockClassProvider())
                .applyMetadata();
            registry.providers.push(injectable.injectableProviderRefs[0]);
            createInjectorWithProviders(injectable.constructorRef, []);
            const spy = spyOn(registry.providers[0], 'resolve');
            injector.resolve();
            expect(spy).toHaveBeenCalled();
        });

        it('The parent injector scope should take preference over the global scope', () => {
            injectable
                .addConstructorParam(new MockClassProvider().updateToken(symbol1))
                .applyMetadata();
            createInjectorWithProviders(injectable.constructorRef, [], [new MockClassProvider().updateToken(symbol1).providerRef()]);
            registry.providers.push(new MockClassProvider().updateToken(symbol1).providerRef());
            const globalSpy = spyOn(registry.providers[0], 'resolve');
            const parentSpy = spyOn(parentInjector.providers[0], 'resolve');
            injector.resolve();
            expect(globalSpy).not.toHaveBeenCalled();
            expect(parentSpy).toHaveBeenCalled();
        });



        it('Should return a new instance of constructor, first waiting for the dependencies resolved from the resolved provider in the order specified in the consrtuctor', async () => {

            class MockClassWithInjectDecorators {
                constructor(
                    @Inject(symbol2) public name: string,
                    @Inject(symbol1) public name2: string,
                ) { }
            }

            createInjectorWithProviders(MockClassWithInjectDecorators, [new ValueProviderRef(symbol1, 10, true), new ValueProviderRef(symbol2, '4', true)]);
            spyOn(injector.providers[0], 'resolve').and.callFake(() => new Promise(resolve => setTimeout(() => resolve('dependency-1'), 200)));
            spyOn(injector.providers[1], 'resolve').and.callFake(() => new Promise(resolve => setTimeout(() => resolve('dependency-0'), 200)));
            const instance = await injector.resolve();
            expect(instance instanceof MockClassWithInjectDecorators).toBe(true);
            expect(instance.name).toBe(`dependency-0`);
            expect(instance.name2).toBe(`dependency-1`);
        });


    });

});
