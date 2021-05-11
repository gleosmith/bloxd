import { Type } from '../common/cli-types';

/**
 * A unique token that allows a provider to be identified and resolved through dependency injection. A token
 * can be a class, string or symbol. A string token should be used with caution as it can mistakenly be used for two
 * different providers. Symbols are unique and therefore should be utilized in place of strings
 *
 * ### EXAMPLE
 *
 * ```ts
 * const API_CONFIG = Symbol('API_CONFIG')
 * const configProvider = { provide: API_CONFIG, useValue: { host: 'localhost', port: 3000 } }
 * ```
 *
 * @publicApi
 */
export type ProviderToken = Type<any> | string | Symbol;


interface BaseProvider {

    /**
     * A unique token that allows a provider to be identified and resolved through dependency injection. A token
     * can be a class, string or symbol. A string token should be used with caution as it can mistakenly be used for two
     * different providers. Symbols are unique and therefore should be utilized in place of strings
     */
    provide: ProviderToken;

    /**
     * Whether the provider should be registered in the global provider scope. Defaults to false
     */
    global?: boolean;

    /**
     * Whether the same instance of the provider is created for each injectable reference for a contructor argument. Conversely when false, a new instance
     * is created for reference. Defaults to true
     */
    singleton?: boolean;

}


/**
 * A type of provider that resolves through a factory function. The factory function can be synchronous or aynchronous
 *
 * @publicApi
 */
export interface FactoryProvider extends BaseProvider {

    /**
     * Factory function that resolves the providers value
     */
    useFactory: () => any | Promise<any>;

}

/**
 * A type of provider that resolves with a static value
 *
 * @publicApi
 */
export interface ValueProvider extends BaseProvider {

    /**
     * Value that the provider resolves with
     */
    useValue: any;

}

/**
 * A type of provider that resolves with an instance of a class
 *
 * @publicApi
 */
export interface ClassProvider<T = any> extends BaseProvider {

    /**
     * Constructor from which the provided class instantiated
     */
    useClass: Type<T>;

}

/**
 * Describes a dependency that can be injected into constructors. Providers can take four forms
 * - a class constructor
 * - a factory provider with a provider token and a factory function. The factory function can be synchronous or aynchronous
 * - a class provider with a provider token and a class constructor
 * - a value provider with a provider token and a static value
 *
 * ### EXAMPLE
 *
 * ```ts
 * @CliModule({
 *   providers: [
 *      LoggerService,
 *      { provide: DB_CONNECTION, useFactory: async () => { } },
 *      { provide: API_CONFIG, useValue: { host: 'localhost', port: 3000 }},
 *      { provide: DefaultApiService, useClass: CustomApiService }
 *   ]
 * })
 * ```
 * ### Provider Tokens
 * Provider tokens can be class constructors, strings or symbols. A string token should be used with caution as it can mistakenly be used for two
 * different providers. Symbols are unique and therefore should be utilised in place of strings
 *
 * ```ts
 * const API_CONFIG = Symbol('API_CONFIG')
 * const configProvider = { provide: API_CONFIG, useValue: { host: 'localhost', port: 3000 } }
 * ```
 */
export type Provider<T = any> = Type<T> | FactoryProvider | ValueProvider | ClassProvider;
