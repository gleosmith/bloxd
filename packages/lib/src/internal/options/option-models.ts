import { Type } from '../common/cli-types';
import { Provider } from '../dependency-injection/providers';


/**
 * Metadata for an options container
 */
export interface OptionsContainerDefinition {

    /**
     * List of providers to be utilized only within the option containers scope
     */
    providers: Provider[];

}

/**
 * Metadata options supplied within the @CliOptions() decorator
 *
 * @publicApi
 */
export interface OptionsOpts extends Partial<OptionsContainerDefinition> {
}


/**
 * Common option properties shared accross multiple models
 */
interface BaseOptionProperties<T = any> {

    /**
     * Allows customizing the command name used in the cli call. If not provided, the name
     * defaults to the dasherized name of the decorated property. Example, the property named *'showErrors'* can be called with *'--show-errors'*. Note the
     * name should not include the *'--'* prefix
     */
    name: string;

    /**
     * An additional shorthand call sign for a cli option. When called, aliases are prefixed with a single dash *'-n'* where full names are prefixed with
     * a double dash *'--name'*. The default value is undefined
     */
    alias: string;

    /**
     * additional metadata that allows for more informative help message
     */
    description: string;

    /**
     * Whether the option is required in the cli call. Required options will cause an error will be thrown
     * if the option is missing. The `HelpModule` can catch the error and display an appropriate help message
     */
    required: boolean;

    /**
     * Placeholder for custom metadata to be attached for use in a custom implementation of the `HelpModule`
     */
    data: T;

    /**
     * When true the argument parsing engine will take the design type of the decorated property, and validate the
     * raw (string) cli argument against this type. If the validation is successful, it will cast to raw argument to this design type before
     * binding it to the property. The default type casting only works on basic types, being strings, booleans and numbers, in addition to special `FilePath` and `Int`
     * types. Where a more complex, unrecognized type is used, the property will be bound with a null value. The type casting option is also provided globally
     * in the ParserModule. This global configuration is applied when this option is unset in the decorator of a specific option.
     */
    typeChecks: boolean;
    


}

/**
 * Optional metadata for modifying the behavior of a cli option
 *
 * @publicApi
 */
export interface CliOptionOpts<T = any> extends Partial<BaseOptionProperties<T>> {
}


/**
 * Description of an option, containing its metadata
 *
 * @publicApi
 */
export interface OptionDescription<T = any> extends Omit<BaseOptionProperties<T>, 'typeChecks'> {

    /**
     * Constructor of the decorated properties design type obtained using reflection
     */
    designType: Type<any>;

}
/**
 * Contains metadata of a class property decorated with @CliOption()
 *
 * @publicApi
 */
export interface OptionDefinition<T = any> extends BaseOptionProperties<T> {

    /**
     * name of the decorated class property
     */
    propertyName: string;

    /**
     * Constructor of the decorated properties design type obtained using reflection
     */
    designType: Type<any>;

}

/**
 * Defines an option parsed from the raw cli string arguments
 *
 * @publicApi
 */
export interface ParsedOption {

    /**
     * Name/alias of the option that was used in the raw cli args
     */
    rawName: string;

    /**
     * The rawName with the single/double dash prefix removed
     */
    cleanedName: string;

    /**
     * Whether the option had a single dash (alias) prefix from the raw cli args, as opposed to a double dash (name)
     */
    isAlias: boolean;

    /**
     * Value from the raw cli args. Where the option was provided as a flag the value should be true
     */
    value: any;

}

/**
 * An option definition mapped to its containing class container
 */
export interface MappedCliOptionDefinition {

    /**
     * Class contructor to which the option belongs
     */
    class: Type<any>;

    /**
     * The option metadata
     */
    def: OptionDefinition;

}
