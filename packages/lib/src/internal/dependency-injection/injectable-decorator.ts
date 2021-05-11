import { registerInjectablesArgs } from './injectable-arg-definition';
import { setMetadata, MetadataKey } from '../common/meta-data';

/**
 * Additional provider metadata
 *
 * @publicApi
 */
export interface InjectableOpts {

    /**
     * Whether the same instance of the provider is created for each injectable reference for a contructor argument. Conversely when false, a new instance
     * is created for reference Defaults to true
     */
    singleton?: boolean;

    /**
     * Whether the provider should be registered within the global scope an be accessable accross all modules and components within the application.
     * Defaults to false
     */
    global?: boolean;
}

/**
 * A class decorator that assigns the neccessary metadata to allow dependencies to be injected into the arguments of the constructor
 *
 * @publicApi
 */
export function Injectable(opts?: InjectableOpts): ClassDecorator {
    return function <T extends new (...args: any[]) => {}>(constructor: T) {
        registerInjectablesArgs(constructor);
        setMetadata<InjectableOpts>(MetadataKey.Provider, constructor, {
            global: opts?.global || false,
            singleton: opts ? (opts.singleton !== undefined ? opts.singleton : true) : true
        });
        return constructor;
    } as ClassDecorator;
}
