import { ProviderUtils } from '../../src/internal/dependency-injection/provider-utils';
import { ConstructorProviderRef } from '../../src/internal/dependency-injection/provider-refs/constructor-provider-ref';
import { FactoryProviderRef } from '../../src/internal/dependency-injection/provider-refs/factory-provider-ref';
import { ValueProviderRef } from '../../src/internal/dependency-injection/provider-refs/value-provider-ref';
import { MockValueProvider, MockClassProvider, MockFactoryProvider, symbol2, symbol3, EmptyClass1, symbol4, MockModule, MockRegistery, symbol1 } from '../shared';
import { ModuleRef } from '../../src/internal/module/module-ref';
import { GlobalComponentsRegistry } from '../../src/internal/app/global-components-registry';
import { setMetadata, MetadataKey } from '../../src/internal/common/meta-data';
import { InjectableOpts } from '../../src/internal/dependency-injection/injectable-decorator';


describe('ProviderUtils[class]', () => {

    let classProvider: MockClassProvider;
    let valueProvider: MockValueProvider;
    let factoryProvider: MockFactoryProvider;
    let registry: GlobalComponentsRegistry;
    let moduleRef: ModuleRef;

    beforeEach(() => {
        moduleRef = new MockModule().createModuleRef().moduleRef;
        registry = new MockRegistery().addProvider(new MockValueProvider(symbol1, '1000')).registry;
        classProvider = new MockClassProvider();
        valueProvider = new MockValueProvider(symbol2, [1, 2, 3]);
        factoryProvider = new MockFactoryProvider(symbol3, MockFactoryProvider.factoryFn1('#'));
    });

    describe('toProviderRef()[static]', () => {

        it('Should return a constructor provider ref when the provider is a constructor', () => {
            expect(ProviderUtils.toProviderRef(classProvider.provider, moduleRef, registry.providers) instanceof ConstructorProviderRef).toBe(true);
        });

        it('Should return a constructor provider ref when the provider has the "useClass" property', () => {
            expect(ProviderUtils.toProviderRef(classProvider.updateToken(EmptyClass1).provider, moduleRef, registry.providers) instanceof ConstructorProviderRef).toBe(true);
        });

        it('Should return a factory provider ref when the provider has the "useFactory" property', () => {
            expect(ProviderUtils.toProviderRef(factoryProvider.provider, moduleRef, registry.providers) instanceof FactoryProviderRef).toBe(true);
        });

        it('Should return a value provider ref when the provider has the "useValue" property', () => {
            expect(ProviderUtils.toProviderRef(valueProvider.provider, moduleRef, registry.providers) instanceof ValueProviderRef).toBe(true);
        });

        it('Should call the contructor provider with parent module and the global providers scope', () => {
            const ref = ProviderUtils.toProviderRef(classProvider.provider, moduleRef, registry.providers) as ConstructorProviderRef;
            expect(ref.parent).toBe(moduleRef);
            expect(ref.globalProviders).toBe(registry.providers);
        });

        it('Singleton should be true when it is undefined or true and must be false when it is set to false for class providers', () => {
            let ref = ProviderUtils.toProviderRef(classProvider.updateToken(EmptyClass1).provider, moduleRef, registry.providers);
            expect(ref.singleton).toBe(true);
            ref = ProviderUtils.toProviderRef(classProvider.updateToken(EmptyClass1).setSingleton(false).provider, moduleRef, registry.providers);
            expect(ref.singleton).toBe(false);
            ref = ProviderUtils.toProviderRef(classProvider.updateToken(EmptyClass1).setSingleton(true).provider, moduleRef, registry.providers);
            expect(ref.singleton).toBe(true);
        });

        it('Singleton should be true when it is undefined or true and must be false when it is set to false for value providers', () => {
            let ref = ProviderUtils.toProviderRef(valueProvider.provider, moduleRef, registry.providers);
            expect(ref.singleton).toBe(true);
            ref = ProviderUtils.toProviderRef(valueProvider.setSingleton(false).provider, moduleRef, registry.providers);
            expect(ref.singleton).toBe(false);
            ref = ProviderUtils.toProviderRef(valueProvider.setSingleton(true).provider, moduleRef, registry.providers);
            expect(ref.singleton).toBe(true);
        });

        it('Singleton should be true when it is undefined or true and must be false when it is set to false for factory providers', () => {
            let ref = ProviderUtils.toProviderRef(factoryProvider.provider, moduleRef, registry.providers);
            expect(ref.singleton).toBe(true);
            ref = ProviderUtils.toProviderRef(factoryProvider.setSingleton(false).provider, moduleRef, registry.providers);
            expect(ref.singleton).toBe(false);
            ref = ProviderUtils.toProviderRef(factoryProvider.setSingleton(true).provider, moduleRef, registry.providers);
            expect(ref.singleton).toBe(true);
        });


        it('Should return a factory provider ref when the provider has the "useFactory" property', () => {
            expect(ProviderUtils.toProviderRef(factoryProvider.provider, moduleRef, registry.providers) instanceof FactoryProviderRef).toBe(true);
        });

        it('Should return a value provider ref when the provider has the "useValue" property', () => {
            expect(ProviderUtils.toProviderRef(valueProvider.provider, moduleRef, registry.providers) instanceof ValueProviderRef).toBe(true);
        });

    });

    describe('isGlobal()[static]', () => {

        it('Should return the global metadata from the contructor if the class is a contructor', () => {
            class MockInjectableClass { }
            setMetadata<InjectableOpts>(MetadataKey.Provider, MockInjectableClass, { global: true });
            expect(ProviderUtils.isGlobal(MockInjectableClass)).toBe(true);
            setMetadata<InjectableOpts>(MetadataKey.Provider, MockInjectableClass, { global: false });
            expect(ProviderUtils.isGlobal(MockInjectableClass)).toBe(false);
        });

        it('Should return the global metadata from the provider if not a class', () => {
            expect(ProviderUtils.isGlobal({ provide: symbol1, useValue: 1, global: true })).toBe(true);
            expect(ProviderUtils.isGlobal({ provide: symbol1, useValue: 1, global: false })).toBe(false);
        });

        it('Should return false when the providers global metadata is not set', () => {
            expect(ProviderUtils.isGlobal({ provide: symbol1, useValue: 1 })).toBe(false);
        });

    });

    describe('isSingleton()[static]', () => {

        it('Should return the singleton metadata from the contructor if the class is a contructor', () => {
            class MockInjectableClass { }
            setMetadata<InjectableOpts>(MetadataKey.Provider, MockInjectableClass, { singleton: true });
            expect(ProviderUtils.isSingleton(MockInjectableClass)).toBe(true);
            setMetadata<InjectableOpts>(MetadataKey.Provider, MockInjectableClass, { singleton: false });
            expect(ProviderUtils.isSingleton(MockInjectableClass)).toBe(false);
        });

        it('Should return the singleton metadata from the provider if not a class', () => {
            expect(ProviderUtils.isSingleton({ provide: symbol1, useValue: 1, singleton: true })).toBe(true);
            expect(ProviderUtils.isSingleton({ provide: symbol1, useValue: 1, singleton: false })).toBe(false);
        });

        it('Should return true when the providers singleton metadata is not set', () => {
            expect(ProviderUtils.isSingleton({ provide: symbol1, useValue: 1 })).toBe(true);
        });

    });

    describe('equal()[static]', () => {

        it('Should return false when to providers have different tokens', () => {
            expect(ProviderUtils.equal(factoryProvider.provider, valueProvider.provider)).toEqual(false);
        });

        it('Should return true when providers have the same token', () => {
            expect(ProviderUtils.equal(factoryProvider.provider, valueProvider.updateToken(symbol3).provider)).toEqual(true);
            expect(ProviderUtils.equal(classProvider.provider, { provide: classProvider.token, useValue: null })).toEqual(true);
        });

    });

    describe('providerToken()[static]', () => {

        it('Should return the constructor when the provider is a constructor', () => {
            expect(ProviderUtils.providerToken(classProvider.provider)).toBe(classProvider.constructorRef);
        });

        it('Should return the token when the provider is not a constructor', () => {
            expect(ProviderUtils.providerToken(classProvider.updateToken('token').provider)).toBe('token');
            expect(ProviderUtils.providerToken(valueProvider.provider)).toBe(symbol2);
        });

    });

    describe('isProvider()[static]', () => {

        it('Should return true when the provider is a constructor', () => {
            expect(ProviderUtils.isProvider(classProvider.provider)).toBe(true);
        });

        it('Should return true when the provider has the "provide" and  "useClass" properties', () => {
            expect(ProviderUtils.isProvider(classProvider.updateToken('token').provider)).toBe(true);
        });

        it('Should return true when the provider has the "provide" and  "useFactory" properties', () => {
            expect(ProviderUtils.isProvider(factoryProvider.provider)).toBe(true);
        });

        it('Should return true when the provider has the "provide" and "useValue" properties', () => {
            expect(ProviderUtils.isProvider(valueProvider.provider)).toBe(true);
        });

        it('Should return false when the provider is not a constructor, nor has a useClass, useFactory or useValue property with a provide property', () => {
            expect(ProviderUtils.isProvider({ provide: 'token' } as any)).toBe(false);
            expect(ProviderUtils.isProvider({ useValue: 'token' } as any)).toBe(false);
            expect(ProviderUtils.isProvider({ prop: 1 } as any)).toBe(false);
        });

    });

    describe('providerName()[static]', () => {

        it('Should return the constructor name when the token is a constructor', () => {
            expect(ProviderUtils.providerName(EmptyClass1)).toBe(EmptyClass1.name);
        });

        it('Should return the token when the token is a string', () => {
            expect(ProviderUtils.providerName('TokenValue')).toBe('TokenValue');
        });

        it('Should return a stringified symbol when the token is a symbol', () => {
            expect(ProviderUtils.providerName(symbol4)).toBe((symbol4).toString());
        });

    });


});
