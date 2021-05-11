
import { ProviderToken } from '../providers';

/**
 * Interface that describes an internal reference to a provider that can be resolved with dependency injection
 *
 */
export interface ProviderRef<T = any> {

    /**
     * The provider key that is used when the `injector` looks up the provider for injection
    */
    injectToken: ProviderToken;

    /**
     * Whether the provider retains the same value for all references
     */
    singleton: boolean;

    /**
     * Returns the value/instance that is injected by the provider. This can be synchronous or asynchronous
     * @param callstack The dependency injection callstack used to identify circular referencing providers.
     */
    resolve(callstack?: ProviderToken[]): T | Promise<T>;

}
