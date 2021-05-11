
import { ProviderToken } from './providers';
import { pushMetaData, MetadataKey } from '../common/meta-data';
import { InjectableArgDefinition } from './injectable-arg-definition';


/**
 * Options passed into the @Inject() decorator
 *
 * @publicApi
 */
export interface InjectOpts {

    /**
     * Whether the dependency is required to exist within the dependency injection scope. If not, then a null value is injected when a provider cannot be resolved else the app with
     * throw an error
     */
    optional?: boolean;

}

/**
 * A parameter decorator used within a class constructor to specify which provider should be injected in the decorated
 * parameter. Where `Inject()` is not utilized, dependency injection uses the parameter's type to resolve the correct
 * provider.
 *
 * ### EXAMPLE
 *
 * ```ts
 * const API_CONFIG = Symbol('API_CONFIG')
 *
 * @CliModule({
 *   providers: [
 *      { provide: API_CONFIG, useValue: { host: 'localhost', port: 3000 } },
 *      ApiService
 *   ]
 * })
 * export class AppModule {}
 *
 * class ApiService {
 *
 *   constructor(@Inject(API_CONFIG) private config: ApiConfig) { }
 *
 * }
 * ```
 *
 * @publicApi
 * @param token The token of the provider which must be injected. Tokens can take the form of a string, symbol or class constructor
 */
export function Inject(token: ProviderToken, opts?: InjectOpts) {
    return function (target: any, propertyKey: string | symbol, index: number) {
        pushMetaData(MetadataKey.InjectableArgs, target.prototype.constructor, {
            injectToken: token,
            optional: opts?.optional || false,
            index
        } as InjectableArgDefinition);
    };
}
