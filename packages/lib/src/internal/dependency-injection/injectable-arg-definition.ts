import { Type } from '../common/cli-types';
import { MetadataKey, getMetadata, setMetadata, hasMetadata } from '../common/meta-data';
import { ProviderToken } from './providers';

/**
 * Metadata that describes an argument of a constructor that is injectable
 */
export interface InjectableArgDefinition {

    /**
     * Position of the argument in constructor's call signature
     */
    index: number;

    /**
     * Where the `@Inject()` decorator has been used it is the token provided into the decorator, else it is the argument's design type attained through reflection
     */
    injectToken: ProviderToken;
    optional: boolean;

}

/**
 * Determines whether a constructor has metadata that allows dependencies to be injected into it
 * @param constructor constructor
 */
export function hasInjectableArgs(constructor: Type<any>): boolean {
    if (hasMetadata(MetadataKey.InjectableArgs, constructor)) {
        return !!getMetadata<any[]>(MetadataKey.InjectableArgs, constructor).length;
    } else {
        return false;
    }
}

/**
 * Returns a constructor's metadata that describes its' arguments for dependency injection
 * @param constructor constructor
 */
export function getInjectablesArgs(constructor: Type<any>): InjectableArgDefinition[] {
    return getMetadata(MetadataKey.InjectableArgs, constructor);
}


/**
 * Attains design metadata from the arguments of a constructor and attaches this metadata to the constructor, with sufficient details to allow dependencies to be
 * injected at a later stage
 * @param constructor constructor
 */
export function registerInjectablesArgs(constructor: Type<any>) {
    const constructorArgs = getMetadata<Type<any>[]>(MetadataKey.DesignParameters, constructor);
    const existingDefintions = getMetadata<InjectableArgDefinition[]>(MetadataKey.InjectableArgs, constructor) || [];
    let definitions: InjectableArgDefinition[] = [];
    if (constructorArgs) {
        definitions = constructorArgs
            .map((cons, index) => existingDefintions.find(d => d.index === index) || {
                injectToken: cons,
                index,
                optional: false
            });
    }
    setMetadata(MetadataKey.InjectableArgs, constructor, definitions.sort((a, b) => a.index > b.index ? 1 : -1));
}
