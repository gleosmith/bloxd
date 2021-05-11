import { ProviderRef } from './provider-ref';
import { Type } from '../../common/cli-types';
import { Injector } from '../injector';
import { ProviderToken } from '../providers';



/**
 * An implementation of the `ProviderRef` that is used when a provider is defined as a class constructor or with the useClass property
 *
 * ### EXAMPLE
 *
 * ```ts
 * @CliModule({
 *     providers: [
 *        AppService,
 *        { provide: APP_SERVICE, useClass: AppService }
 *     ]
 * })
 * ```
 */
export class ConstructorProviderRef<T = any> extends Injector<T> implements ProviderRef<T> {

    injectToken: ProviderToken;

    /**
     * Reference to a class instance that is created from the constructor. Ensures that the same
     * instance is injected into all references (i.e singleton)
     */
    private instance: T;

    /**
     * Determines whether an instance of the class should only be created once per provider reference or
     * if a new instance should be created for each instance
     */
    singleton = true;

    /**
     * Creates a new instance
     * @param token The provider key that is used when the `injector` looks up the provider for injection
     * @param constructorRef The constructor that creates the instance resolved by the provider reference
     * @param singleton Determines whether an instance of the class should only be created once per provider reference or
     * if a new instance should be created for each instance
     * @param parentModule Reference to the parent injector
     * @param globalProviders Reference to the list of providers within the global injection scope
     */
    constructor(
        token: ProviderToken,
        constructorRef: Type<any>,
        singleton: boolean,
        parentModule: Injector,
        globalProviders: ProviderRef[],
    ) {
        super(constructorRef, globalProviders, parentModule);
        this.singleton = singleton;
        this.injectToken = token;
        this.constructorRef = constructorRef;
    }

    /**
     * Resolves an instance of the constructor, calling the base injector to resolve any of its dependencies. When applied as a singleton
     * the constructor is only ever instantiated once else it is instantiated for each call
     * @param callstack The dependency injection callstack used to identify circular referencing providers.
     */
    async resolve(callstack?: ProviderToken[]): Promise<T> {
        if (!this.instance || !this.singleton) {
            this.instance = await super.resolve(callstack);
        }
        return this.instance;
    }

}
