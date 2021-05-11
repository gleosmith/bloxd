import { CliBuildError, Type } from '../common/cli-types';
import { getMetadata, MetadataKey } from '../common/meta-data';
import { CommandDefinition, Command } from './command-models';
import { ModuleRef } from '../module/module-ref';
import { Injector } from '../dependency-injection/injector';
import { ParameterDefinition } from '../parameters/parameter-models';
import { EvaluatedParameter } from '../parser/parameter-parser';
import { ProviderRef } from '../dependency-injection/provider-refs/provider-ref';
import { validateUniqueValues } from '../common/utils';
import { GlobalComponentsRegistry } from '../app/global-components-registry';
import { OptionsLink } from '../options/options-link';

/**
 * Indirect reference to a command class that is responsible for creating an instance of the class and binding the applicable
 * command paramaters before the command is executed
 */
export class CommandRef<T extends Command = any> extends Injector<T> {

    /**
     * Reference to option container applicable to
     */
    options: OptionsLink[];

    /**
     * List of parameter metadata for all properties in the command that have been decorated with `@CliParameter()`
     */
    parameters: ParameterDefinition[];

    /**
     * Reference to the parent injector module
     */
    parent: ModuleRef;

    /**
     * Instance of the command class
     */
    private instance: T;

    /**
     * Creates a new instance of the command reference, reading the metadata that is attached to command's contructor. Will not accept
     * any undecorated command constructors
     * @param constructorRef Constructor of the command
     * @param globalProviders Providers within the global dependency injection scope
     * @param parent Module which exported the command or where the module that declared the command within its metadata
     * @param registry Reference to the global components registery for registering options
     */
    constructor(
        constructorRef: Type<T>,
        globalProviders: ProviderRef[],
        parent: ModuleRef,
        registry: GlobalComponentsRegistry
    ) {
        super(constructorRef, globalProviders, parent);
        this.constructorRef = constructorRef;

        const definition = getMetadata<CommandDefinition>(MetadataKey.Command, constructorRef);
        if (!definition) {
            throw new CliBuildError(`The command ${constructorRef.name} is not valid, you may be missing the @Command() decorator`);
        }

        this.processOptions(registry, definition.options);
        this.parameters = getMetadata<ParameterDefinition[]>(MetadataKey.Parameter, this.constructorRef) || [];
        if (parent) {
            this.providers = parent.registerProviders(getMetadata<CommandDefinition>(MetadataKey.Command, this.constructorRef)?.providers || [], this);
        }
    }

    /**
     * Checks options provided in the command's metadata and registers them in the global components registry
     * @param options List of classes decorated with `@CliOptions()`
     * @param registry Reference to the global components registery for registering options
     */
    private processOptions(
        registry: GlobalComponentsRegistry,
        options: Type<any>[]
    ): void {

        const optionWithoutDecorator = options.find(opt => !getMetadata(MetadataKey.Options, opt));
        if (optionWithoutDecorator) {
            throw new CliBuildError(`Invalid options in ${this.constructorRef.name}: The options class '${optionWithoutDecorator.name}' has not been decorated with @CliOptions`);
        }

        validateUniqueValues(options, opt => opt, opt => `Invalid options in ${this.constructorRef.name}: The same option '${opt.name}' has been included more than once`);

        this.options = options.map(o => registry.registerOptions(o, this.parent));
    }

    /**
     * Creates an instance of the command class, injecting providers and applicable options as well
     * as binding the parameters to the command instance before returning it.
     * @param parameters Validated parameters that have been parsed from the raw cli arguments
     */
    async resolveWithParameters(
        parameters: EvaluatedParameter[]
    ): Promise<T> {
        if (!this.instance) {
            this.providers = [...this.providers, ...this.options.map(p => p.providerRef)];
            this.instance = await super.resolve();
            this.bindParameters(this.instance, parameters);
        }
        return this.instance;
    }

    /**
     * Attaches parameters which have been parsed user to an instance of the command class
     * @param instance Instantiated command class
     * @param parsedParameters Validated parameters that have been parsed from the raw cli arguments
     */
    private bindParameters(
        instance: T,
        parsedParameters: EvaluatedParameter[]
    ): void {
        this.parameters.forEach((def) => {
            const parsedDef = parsedParameters.find(p => p.definition.propertyName === def.propertyName);
            if (parsedDef) {
                instance[def.propertyName] = parsedDef.value !== undefined ? parsedDef.value : instance[def.propertyName];
            }
        });
    }

}
