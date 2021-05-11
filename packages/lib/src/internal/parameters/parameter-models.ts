import { Type } from '../common/cli-types';

/**
 * Common parameter properties shared accross multiple models
 */
interface BaseParameterProperties<T = any> {

    /**
     *  Additional metadata that allows for more informative help messages
     */
    description: string;

    /**
     * Optional parameters don't need to be provided by the user when calls are made to the specific cli command. In contrast,
     * if required parameters are missed an error will be thrown. If the `HelpModule` has been utilized, this error will be caught and the cli help
     * will be displayed. Optional parameters cannot be positioned before required parameters. Defaults to false.
     */
    optional: boolean;

    /**
     * When true the argument parsing engine will take the design type of the decorated property, and validate the
     * raw (string) cli argument against this type. If the validation is successful, it will cast the raw argument to this design type before
     * binding it to the property. The default type casting only works on basic types, being strings, booleans and numbers, in additional to special `FilePath` and `Int`
     * types. Where a more complex, unrecognized type is used, the property will be bound with a null value. The type casting option is also provided globally
     * in the ParserModule. This global configuration is applied when this option is unset in the decorator of a specific parameter.
     */
    typeChecks: boolean;

    /**
     * Allows customizing the parameter name for when it is displayed in help messages. If this option is not provided, this
     * defaults to the dasherized name of the decorated property. Example: *dirPath* will become *dir-path*
     */
    name: string;

    /**
     * A placeholder for custom metadata to be attached for use in a custom implementation of the `HelpModule`.
     */
    data: T;

}

/**
 * Optional metadata for modifying the behavior of cli parameters and providing more informative help messages
 *
 * @publicApi
 */
export interface CliParameterOpts<T = any> extends Partial<BaseParameterProperties<T>> {
}

/**
 * Contains metadata of a class property decorated with @CliParameter()
 *
 * @publicApi
 */
export interface ParameterDefinition<T = any> extends BaseParameterProperties<T> {

    /**
     * Position index of the parameter, starting at 1
     */
    index: number;

    /**
     * name of the decorated class property
     */
    propertyName: string;

    /**
     * Constructor of the decorated property's design type, obtained using reflection
     */
    designType: Type<any>;

    /**
     * Whether the parameter accepts multiple values
     */
    isArray: boolean;

}

/**
 * Description of a parameter for a specific command, containing its metadata
 *
 * @publicApi
 */
export interface ParameterDescription<T = any> extends Omit<BaseParameterProperties<T>, 'typeChecks'> {

    /**
    * Position index of the parameter, starting at 1
    */
    index: number;

    /**
     * Constructor of the decorated property's design type, obtained using reflection
     */
    designType: Type<any>;

    /**
     * Whether the parameter accepts multiple values
     */
    isArray: boolean;

}
