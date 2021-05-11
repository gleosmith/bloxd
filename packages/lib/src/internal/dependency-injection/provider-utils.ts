import { ProviderRef } from './provider-refs/provider-ref';
import { Provider, FactoryProvider, ValueProvider, ClassProvider, ProviderToken } from './providers';
import { isConstructor } from '../common/utils';
import { ConstructorProviderRef } from './provider-refs/constructor-provider-ref';
import { Type } from '../common/cli-types';
import { FactoryProviderRef } from './provider-refs/factory-provider-ref';
import { ValueProviderRef } from './provider-refs/value-provider-ref';
import { ConfiguredModule } from '../module/module-models';
import { ModuleRef } from '../module/module-ref';
import { getMetadata, MetadataKey } from '../common/meta-data';
import { InjectableOpts } from './injectable-decorator';
import { CommandRoute } from '../command/command-routes';
import { Injector } from './injector';

/**
 * A set of utility functions that assist working with providers
 */
export class ProviderUtils {

    /**
     * A factory function that creates the appropriate `ProviderRef` from a `Provider`
     * @param provider provider from which ProviderRef must be created
     */
    static toProviderRef(provider: Provider, parent: Injector, globalProviders: ProviderRef[]): ProviderRef {
        let providerRef: ProviderRef;


        if (isConstructor(provider)) {
            providerRef = new ConstructorProviderRef(provider as Type<any>, provider as Type<any>, ProviderUtils.isSingleton(provider), parent, globalProviders);
        } else if (provider.hasOwnProperty('useFactory')) {
            providerRef = new FactoryProviderRef((provider as FactoryProvider).provide, (provider as FactoryProvider).useFactory, ProviderUtils.isSingleton(provider));
        } else if (provider.hasOwnProperty('useValue')) {
            providerRef = new ValueProviderRef((provider as ValueProvider).provide, (provider as ValueProvider).useValue, ProviderUtils.isSingleton(provider));
        } else if (provider.hasOwnProperty('useClass')) {
            providerRef = new ConstructorProviderRef((provider as ClassProvider).provide, (provider as ClassProvider).useClass, ProviderUtils.isSingleton(provider), parent, globalProviders);
        }

        return providerRef;
    }

    /**
     * Determines if two providers are 'equal' to one another by comparing their tokens
     * @param provider1 comparison provider 1
     * @param provider2 comparison provider 2
     */
    static equal(provider1: Provider, provider2: Provider): boolean {
        return ProviderUtils.providerToken(provider1) === ProviderUtils.providerToken(provider2);
    }

    static isGlobal(provider: Provider): boolean {
        if (isConstructor(provider)) {
            if (getMetadata(MetadataKey.Provider, provider as Type<any>)) {
                return getMetadata<InjectableOpts>(MetadataKey.Provider, provider as Type<any>).global;
            }
            return false;
        } else {
            return (provider as ValueProvider).global || false;
        }
    }

    static isSingleton(provider: Provider): boolean {
        if (isConstructor(provider)) {
            if (getMetadata(MetadataKey.Provider, provider as Type<any>)) {
                return getMetadata<InjectableOpts>(MetadataKey.Provider, provider as Type<any>).singleton;
            }
            return true;
        } else {
            return (provider as ValueProvider).singleton !== undefined ? (provider as ValueProvider).singleton : true;
        }
    }


    /**
     *  Returns the provider token based on the provider's type
     * @param provider provider
     */
    static providerToken(provider: Provider): ProviderToken {
        if (isConstructor(provider)) {
            return provider as Type<any>;
        } else {
            provider = provider as FactoryProvider | ValueProvider | ClassProvider;
            return provider.provide;
        }
    }

    /**
     * Determines if an object meets some sort of provider definition. This method has limitations as other constructors (Commands/Modules) could
     * be classified as providers
     * @param model object to check
     */
    static isProvider(model: CommandRoute | Type<any> | Provider | ConfiguredModule) {
        if (isConstructor(model)) {
            return true;
        } else {
            if (model) {
                return model.hasOwnProperty('provide') &&
                    (model.hasOwnProperty('useFactory') || model.hasOwnProperty('useClass') || model.hasOwnProperty('useValue'));
            }
            return false;
        }
    }

    /**
     * Returns a user-friendly name from a provider token to display in informative error messages
     * @param key The provider's token which can be a class constructor, string or symbol
     */
    static providerName(key: ProviderToken): string {
        if (typeof key === 'string') {
            return key;
        } else {
            if (isConstructor(key)) {
                return (key as Type<any>).name;
            } else if (!!key) {
                return (key as Symbol).toString();
            }
            return String(key);
        }
    }

}
