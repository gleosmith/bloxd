import { CliBuildError, Type } from '../common/cli-types';
import { hasInjectableArgs, getInjectablesArgs } from './injectable-arg-definition';
import { ProviderRef } from './provider-refs/provider-ref';
import { ProviderToken } from './providers';
import { asyncMap, isConstructor } from '../common/utils';
import { hasMetadata, MetadataKey } from '../common/meta-data';

/**
 * A super class that is applied to all application components that can inject dependencies within their constructors
 */
export class Injector<T = any> {

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

    /**
     * Reference to the parent injector so that the providers can be resolved up the hierarchical tree
     */
    parent?: Injector<any>;

    /**
     * Constructor of the class which dependencies are injected into
     */
    constructorRef: Type<T>;

    /**
     * List of providers within the global dependency injection scope
     */
    globalProviders: ProviderRef[];

    /**
     * List of providers within the local dependency injection scope
     */
    providers: ProviderRef[] = [];


    /**
     * Creates a new instance of the injector
     * @param cons constructor of the class which dependencies are injected into
     * @param globalProviders List of providers within the global dependency injection scope
     * @param parent Reference to the parent injector so that the providers can be resolved up the hierarchical tree
     */
    constructor(cons: Type<T>, globalProviders: ProviderRef[], parent?: Injector<any>,) {
        this.constructorRef = cons;
        this.parent = parent;
        this.globalProviders = globalProviders;
    }

    /**
     * Creates a new instance of the injectors contructor, injecting dependencies where neccessary
     * @param callstack Previously resolved dependencies to determine circular references
     */
    async resolve(callstack?: ProviderToken[]): Promise<T> {
        callstack = callstack || [];
        if (hasInjectableArgs(this.constructorRef)) {

            const metadata = getInjectablesArgs(this.constructorRef).sort((a, b) => a.index > b.index ? 1 : -1);
            if (metadata.length < this.constructorRef.length) {
                throw new CliBuildError(`Can'\t resolve all dependencies for ${this.constructorRef.name}. Are you missing the @Injectable() class decorator or the @Inject() parameter decorator?`);
            }

            const deps = await asyncMap(getInjectablesArgs(this.constructorRef).sort((a, b) => a.index > b.index ? 1 : -1), async (dependency) => {
                const newCallstack = [...callstack];
                newCallstack.push(this.constructorRef);
                const provider = this.findProvider(dependency.injectToken);
                if (!provider) {
                    if (!dependency.optional) {
                        this.throwMissingProviderError(dependency.injectToken);
                    } else {
                        return null;
                    }
                } else {
                    if (newCallstack.indexOf(dependency.injectToken) !== -1) {
                        throw new CliBuildError('Circular reference detected in dependency injection. Call stack, ' + newCallstack.map(x => Injector.providerName(x)).join(' => ') + ' => ' + Injector.providerName(dependency.injectToken));
                    }
                    return await provider.resolve(newCallstack);
                }
            });
            return new this.constructorRef(...deps);
        } else {
            if (!this.constructorRef.length) {
                return new this.constructorRef();
            } else {
                throw new CliBuildError(`Cannot inject arguments into ${this.constructorRef.name}. Are you missing the @Injectable() decorator?`);
            }
        }
    }

    /**
     * Throws an appropriate error when a dependency cannot be resolved for a constructor argument
     * @param token inject token of the provider dependency
     */
    private throwMissingProviderError(token: ProviderToken) {
        if (isConstructor(token)) {
            if (hasMetadata(MetadataKey.Options, token as Type<any>)) {
                throw new CliBuildError(`Cannot resolve the options ${Injector.providerName(token)}`);
            } else {
                throw new CliBuildError(`Cannot resolve the provider ${Injector.providerName(token)}. Are you sure this provider has been include into the metadata of a @CliModule?`);
            }
        } else {
            throw new CliBuildError(`Cannot resolve the provider ${Injector.providerName(token)}.Are you sure this provider has been include into the metadata of a @CliModule?`);
        }
    }

    /**
     * Resolves a provider within the injector's scope, first checking local providers, then looking for providers within parent injectors and finally looking
     * injectors within the global scope
     * @param token inject token of the provider dependency
     */
    private findProvider(token: ProviderToken) {
        let provider: ProviderRef;
        provider = this.providers.find(p => p.injectToken === token);
        if (!provider) {

            let parent = this.parent;
            while (!!parent) {
                provider = parent.providers.find(p => p.injectToken === token);
                if (provider) {
                    break;
                }
                parent = parent.parent;
            }

            if (!provider) {
                provider = this.globalProviders.find(p => p.injectToken === token);
            }
        }
        return provider;
    }



}
