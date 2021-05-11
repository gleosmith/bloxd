export const PARSER_CONFIG = Symbol('PARSER_CONFIG');

/**
 * Configuration for the default implementations of the ParserModule
 *
 * @publicApi
 */
export interface ParserConfig {

    /**
     * Default value is true. Global configuration for the use of the type casting behavior where parameter and option values
     * are validated and cast to their design type. Under the default ParserModule implementations, this
     * configuration is applied when the *typeChecks* property provided within a `@CliParameter()` and or
     * a `@CliOption()` decorator has not been set. If it has been set, these values will take preference
     * over this global configuration.
     */
    applyTypeCasting: boolean;

    /**
     * Default value is false. This option is used in the default `OptionsParser` implementation. When true it will throw an `OptionParsingError` if the user
     * has provided options that are not known for the specific command that has been called. When false, these extra options will be
     * ignored.
     */
    ignoreUnknownOptions: boolean;

    /**
     * Default value is false. This option is used in the default `ParameterParser` implementation. When true it will throw an `ParameterParsingError` if the user
     * has provided more parameters than are know to the command. When false, these extra options will be ignored.
     */
    ignoreUnknownParameters: boolean;

    /**
     * Default value is false. This option is used by the default `ArgumentsParser` implementation. When false only arguments that come before the first option
     * in the raw cli arguments can be considered as commands. When false, arguments both before and after options can be considered as
     * commands.
     *
     * #### EXAMPLE
     * Possible commands are highlighted
     * - **FALSE**: mycli `create` `file` --name file.txt /src/folder
     * - **TRUE**: mycli `create` `file` --name file.txt `/src/folder`
     */
    allowCommandsAfterOptions: boolean;
}

/**
 * Default configuration for the ParserModule
 */
export const parserConfig: ParserConfig = {
    applyTypeCasting: true,
    ignoreUnknownOptions: false,
    ignoreUnknownParameters: false,
    allowCommandsAfterOptions: false,
};
