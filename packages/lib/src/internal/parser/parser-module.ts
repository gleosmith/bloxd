
import { CliModule } from '../module/module-decorator';
import { ConfiguredModule } from '../module/module-models';
import { Type } from '../common/cli-types';
import { ArgumentsParser, DefaultArgumentsParser, ARGS_PARSER } from './arguments-parser';
import { EvaluatedArgumentsContext } from './arguments-context';
import { ModuleRef } from '../module/module-ref';
import { ParsedOption } from '../options/option-models';
import { OptionsValidator } from './options-validator';
import { DefaultOptionsParser, OptionsParser, EvaluatedOption, OPTIONS_PARSER } from './options-parser';
import { isConstructor } from '../common/utils';
import { ParserConfig, parserConfig, PARSER_CONFIG } from './parser-config';
import { DefaultParameterParser, ParameterParser, EvaluatedParameter, PARAMETERS_PARSER } from './parameter-parser';
import { ParametersValidator } from './parameter-validator';
import { ParameterDefinition } from '../parameters/parameter-models';
import { TypeCaster, DefaultTypeCaster, TYPE_CASTER } from './type-caster';
import { Inject } from '../dependency-injection/inject-decorator';
import { RegisteredRoute } from '../command/registered-route';

/**
 * Options passed into the `ParserModule`, including configurations for the default behaviour as well as
 * custom provider implementations to modify the parsing behavior
 *
 * @publicApi
 */
export interface ParserModuleOpts {

    /**
     * Custom implementation of the argument parsing behavior that transforms raw cli agruments in to
     * a understandable context
     */
    arguments?: Type<ArgumentsParser> | ArgumentsParser;

    /**
     * Custom option parsing implementation that validates and associates parsed options with metadata
     */
    options?: Type<OptionsParser> | OptionsParser;

    /**
     * Custom implementation of the parameter parsing behavior that validates and associates parameter values with metadata
     */
    parameters?: Type<ParameterParser> | ParameterParser;

    /**
     * Custom implementation of the type casting behaviour that validates and casts option and parameter values against the
     * design time from their relevant metadata
     */
    typeCaster?: Type<TypeCaster> | TypeCaster;

    /**
     * Configuration for the default parsing implementations allowing certain fuctionality to be modified
     */
    config?: Partial<ParserConfig>;

}

/**
 * The ParserModule is responsible for processing the raw cli arguments to resolve commands and or subcommands, as well as
 * parse and validate both parameters and options using the metadata for the specific execution path. The ParserModule
 * must be imported in application's root module. The ParserModule provides default behaviour which provides some configuration
 * the *ParserModule.forRoot()* function. The individual pieces can be interchanged with custom implementations through providers in
 * the *ParserModule.forRoot()*. These providers are for arguments parsing, options parsing, parameter parsing and type castings.
 * These implementations can be services which can inject other providers or they simple objects that adhere to the
 * relevant implementation interface. The ParserModule works hand-in-hand with the HelpModule as it throws errors that can be caught
 * by the HelpModule to display informative messages to the user. The HelpModule itself can also be configured to implement custom
 * behavior.
 *
 * ### ARGUMENT PARSING
 * Argument parsing refers to the processing of the raw cli arguments, being a string array, into a context that can be utilized to evaluate
 * and resolve commands, as well as validate options and parameters against thier metadata. Custom implementations must implement the `ArgumentsParser`
 * which has a single function *parse* that takes in a string array and returns a `ArgumentsContext`. The context contains parsed arguments, possible parameters
 * and possible commands. There should be an overlap between the possible parameters and possible commands. For more information refer the the default implementation
 * `DefaultArgumentsParser`.
 *
 * #### DEFAULT BEHAVIOR
 * - All arguments prefixed with -- or - are taken as options [*create value `-v` `--s`*]
 * - Arguments immediately after options, not prefixed with dashes, are taken as the option's value [create *--prod --name `my-name` value*]
 * - Options that do not have a preceeding value are taken as option flags and will have a value equal to true
 * - Where the same option is provided twice it will have an array value [*create `-v` name `-v` name2*] := ['name', 'name2']
 * - Possible parameters are taken as arguments that are not an option or an option value [*`create` `value` -v --s my-name `value2`*]
 * - By default, possible commands are taken as all arguments before the first option [*`create` `value` -v --s my-name value2*]
 * - If the *ParserConfig.allowCommandsAfterOptions* is set to true then possible commands will be the same as possible parameters
 *
 * ### OPTION PARSING
 * Option parsing consumes options metadata and the parsed arguments from the argument parsing implementation to validate and associate the
 * parsed options with the revelant metadata, allowing the options to be bound and injected at later stages. Options are only parsed once an
 * execution path has been resolved to a specific command or subcommand, meaning the option metadata consumed by the parser is only relevant
 * to a specific command. A custom implementation must implement the `OptionsParser` and the default implementation is the `DefaultOptionsParser`
 *
 * #### DEFAULT BEHAVIOUR
 * - Throws an `OptionParsingError` when one or more parsed arguments do not have associated metadata
 * and *ParserConfig.ignoreUnknownOptions* is set to false
 * - Throws an `OptionParsingError` when no parsed options are found for options that have *required* metadata set to true
 * - Throws an `OptionParsingError` when the raw options contain the same option that called by both its name and
 * alias
 * - Validates and casts the option values through the `TypeCaster` where (a) the option's *typeChecks* metadata is set to true
 * (b) the option's *typeChecks* metadata is undefined (or unset) and the *ParserConfig.applyTypeCasting* is set to true
 *
 * ### PARAMETER PARSING
 * The role of parameter parsing is to validate and associate parameter values with their metadata. Parameters values are recieved as a string array after
 * an execution path has been resolved to specific command or subcommand, meaning that the parameters values can not be mistaken for a command and that the
 * parameter metadata is specific to a single command. Custom implementations must implement the `ParameterParser` interface and the default behaviour is provided
 * by the `DefaultParameterParser`
 *
 * #### DEFAULT BEHAVIOUR
 * - Throws `ParameterParsingError` when required parameters a missing
 * - Throws `ParameterParsingError` when too many parameters have been provided and *ParserConfig.ignoreUnknownParameters* is false
 * - Validates and casts parameter values through the `TypeCaster` where (a) the parameter's *typeChecks* metadata is set to true
 * (b) the parameter's *typeChecks* is undefined (unset) and the *ParserConfig.applyTypeCasting* is set to true
 *
 * ### TYPE CASTING
 * Type casting is used to validate and cast the parameter and option values to the design type attained from that option or parameter's metadata. Design types
 * are obtained through the reflection api and are therefore type Constructors. As such, more complex types such as unions, intersections, interfaces and generics
 * will not be able to be validated using this approach.  A custom implementation must implement the `TypeCaster` interface and the
 * default implementation is the `DefaultTypeCaster`
 *
 * #### DEFAULT BEHAVOR
 * - Ability to validate and cast the string, number, boolean, `Int`, `FilePath` types
 * - Other types will not be cast and returned their original values
 * - The `Int` type only accepts integers while numbers accept decimal places
 * - The `FilePath` is a special type which validates as string input to a valid file or directory,
 * returning an absolute and relative path once cast
 * - Booleans accept the strings *'true'* or *'false'* and *'0'* or *'1'*
 *
 * ### EXAMPLE
 *
 * ```ts
 *
 * // with defaults
 * @CliModule({
 *    imports: [ParserModule]
 * })
 *
 * // with configurations
 * @CliModule({
 *    imports: [
 *      ParserModule.forRoot({
 *        config: {
 *          applyTypeCasting: true,
 *          ignoreUnknownOptions: true,
 *          ignoreUnknownParameters: false,
 *          allowCommandsAfterOptions: false
 *      }})
 *    ]
 * })
 *
 * // with custom implementations
 * @CliModule({
 *    imports: [
 *      ParserModule.forRoot({
 *       arguments: CustomArgsParser,
 *       options: CustomOptionParser,
 *       parameters: CustomParameterParser,
 *       typeCaster: CustomTypeCaster,
 *    })]
 * })
 * ```
 *
 * @publicApi
 */
@CliModule({
    providers: [
        OptionsValidator,
        ParametersValidator,
        { provide: ARGS_PARSER, useClass: DefaultArgumentsParser },
        { provide: OPTIONS_PARSER, useClass: DefaultOptionsParser },
        { provide: PARAMETERS_PARSER, useClass: DefaultParameterParser },
        { provide: TYPE_CASTER, useClass: DefaultTypeCaster },
        { provide: PARSER_CONFIG, useValue: parserConfig }
    ]
})
export class ParserModule {

    /**
     * Configurable ParserModule where individual providers can be interchanged for the implementation of custom behaviour
     * @param parserModuleOpts Custom provider implementations and configuration for the default behavior
     */
    static forRoot(parserModuleOpts?: ParserModuleOpts): ConfiguredModule {

        return {
            module: ParserModule,
            providers: parserModuleOpts ? [
                ...(parserModuleOpts.arguments ? [ParserModule.createProvider(ARGS_PARSER, parserModuleOpts.arguments)] : []),
                ...(parserModuleOpts.options ? [ParserModule.createProvider(OPTIONS_PARSER, parserModuleOpts.options)] : []),
                ...(parserModuleOpts.parameters ? [ParserModule.createProvider(PARAMETERS_PARSER, parserModuleOpts.parameters)] : []),
                ...(parserModuleOpts.typeCaster ? [ParserModule.createProvider(TYPE_CASTER, parserModuleOpts.typeCaster)] : []),
                ...(parserModuleOpts.config ? [ParserModule.createProvider(PARSER_CONFIG, { ...parserConfig, ...parserModuleOpts.config })] : []),
            ] : []
        };

    }

    /**
     * Creates and returns a value or class provider based on the provider value that is passed into the function
     * @param injectToken The provider token
     * @param classOrObject Provider as a constructor or value
     */
    private static createProvider(
        injectToken: Symbol,
        classOrObject: Partial<ParserConfig> | TypeCaster | Type<TypeCaster> | ArgumentsParser | Type<ArgumentsParser> | OptionsParser
            | Type<OptionsParser> | ParameterParser | Type<ParameterParser>
    ) {
        return isConstructor(classOrObject)
            ? { provide: injectToken, useClass: classOrObject as Type<any> }
            : { provide: injectToken, useValue: classOrObject };
    }

    /**
     * Creates a new instance of the ParserModule
     * @param argsParser Implementation of the argument parsing behavior
     * @param optionsParser Implementation of the option parsing behavior
     * @param parametersParser Implementation of the parameter parsing behavior
     * @param parameterValidator Service that validates parameter metadata
     * @param optionsValidator Service that validates option metadata
     */
    constructor(
        @Inject(ARGS_PARSER) private argsParser: ArgumentsParser,
        @Inject(OPTIONS_PARSER) private optionsParser: OptionsParser,
        @Inject(PARAMETERS_PARSER) private parametersParser: ParameterParser,
        private parameterValidator: ParametersValidator,
        private optionsValidator: OptionsValidator,
    ) {
    }

    /**
     * Validates the metadata for all commands in a specific module, an recursively iterates down the module hierarchy to validate
     * all subcommands
     * @param moduleRef Module to validate
     */
    validate(
        moduleRef: ModuleRef
    ): void {
        moduleRef.routes.forEach(route => {
            if (route.isCommand) {
                this.optionsValidator.validate(route.getMappedOptions());
                this.parameterValidator.validate(route.command.parameters, route.path);
            } else {
                this.validate(route.module);
            }
        });
    }

    /**
     * Takes the cli context to resolve a command route. This function builds the execution path, and is therfore called until no more command routes
     * can be resolved from the context. On the first call it consumes the raw cli arguments and parses this through the `ArgumentsParser` implementation
     * before attempting to resolve the command route. For subsequent calls in takes in an `EvaluatedArgumentsContext` to try resolve further steps in the execution path
     * @param rawArgsOrContext Raw cli arguments as a string array or an evaluated context with a resolved command route
     * @param routes Command routes specific to current module in the execution path
     */
    evalauteContext(
        rawArgsOrContext: string[] | EvaluatedArgumentsContext,
        routes: RegisteredRoute[],
    ): EvaluatedArgumentsContext {

        const context = rawArgsOrContext instanceof Array ? this.argsParser.parse(rawArgsOrContext.filter(arg => !!arg)) : rawArgsOrContext;
        let route: RegisteredRoute;
        if (context.possibleCommands.length) {
            route = routes
                .filter(r => r.path !== '*')
                .find(command => command.path === context.possibleCommands[0] || command.alias === context.possibleCommands[0]);
            if (route) {
                context.possibleCommands = context.possibleCommands.slice(1);
                context.possibleParameters = context.possibleParameters.slice(1);
            }
        }
        route = route ? route : routes.find(command => command.path === '*');
        return { ...context, route };
    }

    /**
     * Obtains the option metadata specific to the current execution path and then parses the
     * options through the implementation of the `OptionsParser`
     * @param route Command to be executed
     * @param options Parsed options resolved through the `ArgumentsParser`
     */
    evaulateOptions(
        route: RegisteredRoute,
        options: ParsedOption[]
    ): EvaluatedOption[] {
        return this.optionsParser.parseOptions(route.getOptionsMetadata(), options);
    }

    /**
     * Parses the parameters through the `ParameterParser` by supplying both parameter values and metadata
     * @param definitions Parameter metadata for the executed command
     * @param parameters Remaining parameters after the execution path has been resolved
     */
    evaulateParameters(
        definitions: ParameterDefinition[],
        parameters: string[]
    ): EvaluatedParameter[] {
        return this.parametersParser.parseParameters(definitions, parameters);
    }


}
