
import { CliBuildError, Type } from '../common/cli-types';
import { ModuleRef } from '../module/module-ref';
import { Injector } from '../dependency-injection/injector';
import { ProviderRef } from '../dependency-injection/provider-refs/provider-ref';
import { EvaluatedOption } from '../parser/options-parser';
import { OptionDefinition, OptionsContainerDefinition} from './option-models';
import { getMetadata, MetadataKey } from '../common/meta-data';

/**
 * An internal reference to cli options that can be injected into modules and/or commands, similiar to other providers.
 * This ProviderRef implementation also handles the binding of option properties and triggers execution of the afterOptionsInit hook if it
 * has been implemented. Different to other providers, an instance of the option needs to be created for each option in the execution path
 * regardless of whether it is eventually injected as a dependency into another class
 */
export class OptionsProviderRef<T = any> extends Injector<T> implements ProviderRef<T> {

    injectToken: Type<T>;

    /**
     * Metadata of the option properties for the container class
     */
    optionsMetadata: OptionDefinition[];

    /**
     * Reference to the instantiated options
     */
    private instance: T;


    singleton = true;

    /**
     * Creates a new instance of the options provider and reads the options metadata
     * @param constructorRef Constructor of the options container
     * @param parent Parent injector for the container
     * @param globalProviders Reference to global injection scope
     */
    constructor(
        constructorRef: Type<any>,
        parent: ModuleRef,
        globalProviders: ProviderRef[],
    ) {
        super(constructorRef, globalProviders, parent);
        this.injectToken = constructorRef;
        this.optionsMetadata = getMetadata<OptionDefinition[]>(MetadataKey.Option, this.constructorRef) || [];
        if (parent) {
            this.providers = parent.registerProviders(getMetadata<OptionsContainerDefinition>(MetadataKey.Options, this.constructorRef)?.providers || [], this);
        }
    
    }

    /**
     * Instantiates an instance of the options contructor, injecting dependencies into the constructor if required. Binds the parsed options to
     * the decorated option properties, and executed the afterOptionsInit hook if it has been implemented.
     * @param moduleRef The module which originated the `injector` call
     * @param callstack The dependency injection callstack used to identify circular referencing providers
     */
    async init(parsedOptions: EvaluatedOption[]) {
        this.instance = await super.resolve();
        this.optionsMetadata.forEach(opt => {
            const parsedOpt = parsedOptions.find(o => o.definition.name === opt.name || (!!opt.alias && opt.alias === o.definition.alias));
            if (parsedOpt) {
                this.instance[opt.propertyName] = parsedOpt.value !== undefined ? parsedOpt.value : this.instance[opt.propertyName];
            }
        });
        if ((this.instance as any).afterOptionsInit) {
            await (this.instance as any).afterOptionsInit();
        }
    }

    /**
     * Returns the options instance. Will throw an error if the init function has not been called prior resolving the value
     * @param moduleRef The module which originated the `injector` call
     * @param callstack The dependency injection callstack used to identify circular referencing providers
     */
    async resolve(): Promise<T> {
        if (!this.instance) {
            throw new CliBuildError(`Could not resolve options that have not been initialized, ${this.constructorRef.name}`);
        }
        return this.instance;
    }

}
