import { ProviderRef } from './provider-ref';
import { ProviderToken } from '../providers';

/**
 * An implementation of the `ProviderRef` that is used when a provider is defined with a static value through the useValue property
 *
 * ```ts
 * @CliModule({
 *     providers: [
 *        { provide: CONNECTION_CONFIG, useValue: { host: 'localhost', port: 3000 } }
 *     ]
 * })
 * ```
 */
export class ValueProviderRef<T = any> implements ProviderRef<T> {

    injectToken: ProviderToken;

    /**
     * Determines whether the same value should be injected for all provider references or whether an immutable value
     * should be injected
     */
    singleton = true;

    /**
     * Value that is resolved by the provider
     */
    private value: any;

    /**
     * Creates a new instance
     * @param token The provider key that is used when the `injector` looks up the provider for injection
     * @param value value that is resolved by the provider
     * @param singleton Determines whether the same value should be injected for all provider references or whether an immutable value
     * should be injected
     */
    constructor(
        token: ProviderToken,
        value: any,
        singleton: boolean
    ) {
        this.injectToken = token;
        this.singleton = singleton;
        this.value = value;
    }

    /**
     * Returns the value of the provider
     * @param callstack The dependency injection callstack used to identify circular referencing providers.
     */
    resolve(callstack?: ProviderToken[]): T {
        if (this.singleton) {
            return this.value;
        } else {
            return this.clone(this.value);
        }
    }

    /**
     * Creates an immutable copy of an object
     * @param obj object to clone
     */
    private clone(obj: any) {
        let copy: any;

        if (obj === null || obj === undefined || 'object' !== typeof obj) {
            return obj;
        }

        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        if (obj instanceof Array) {
            copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.clone(obj[i]);
            }
            return copy;
        }

        if (obj instanceof Object) {
            copy = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    copy[key] = this.clone(obj[key]);
                }
            }
            return copy;
        }

    }

}
