import { ProviderRef } from './provider-ref';
import { ProviderToken } from '../providers';

/**
 * An implementation of the `ProviderRef` that is used when a provider is defined as a factory function with the useFactory property.
 * The factory can be synchronous or asynchronous
 *
 * ```ts
 * @CliModule({
 *     providers: [
 *          { provide: APP_SERVICE, useFactory: async () => { } }
 *     ]
 * })
 * ```
 */
export class FactoryProviderRef<T = any> implements ProviderRef<T> {

    injectToken: ProviderToken;

    /**
     * Reference to the factory function defined in the provider
     */
    private factoryFn: (...args: any) => T;

    /**
     * Reference to the value that is returned by the factory function, ensuring that the provider follows a singleton approach
     * and only executes the factory function once for multiple references
     */
    private value: T;

    /**
     * Determines whether factory function should only be called once for all provider references or whether the it
     * should be called for each reference
     */
    singleton = true;

    /**
     * Creates a new instance
     * @param token The provider key that is used when the `injector` looks up the provider for injection
     * @param factoryFn Factory function that is called when the provider is resolved.
     * @param singleton Determines whether factory function should only be called once for all provider references or whether the it
     * should be called for each reference
     */
    constructor(
        token: ProviderToken,
        factoryFn: (...args: any) => T,
        singleton: boolean,
    ) {
        this.injectToken = token;
        this.factoryFn = factoryFn;
        this.singleton = singleton;
    }


    async resolve(callstack?: ProviderToken[]): Promise<T> {
        if (!this.value || !this.singleton) {
            this.value = await this.factoryFn();
        }
        return this.value;
    }

}
