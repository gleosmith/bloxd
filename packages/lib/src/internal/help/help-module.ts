import { CommandHelp, COMMAND_HELP, DefaultCommandHelp } from './command-help';
import { Type } from '../common/cli-types';
import { ModuleHelp, MODULE_HELP, DefaultModuleHelp } from './module-help';
import { CliModule } from '../module/module-decorator';
import { HelpUtilities } from './help-utilities';
import { ConfiguredModule, ModuleDescription } from '../module/module-models';
import { HELP_ERRORS, defaultHelpErrors } from './help-errors';
import { isConstructor } from '../common/utils';
import { Inject } from '../dependency-injection/inject-decorator';
import { AppContext } from '../app/app-context';
import { ModuleRef } from '../module/module-ref';
import { RegisteredRoute } from '../command/registered-route';
import { CommandDescription } from '../command/command-models';
import { ParameterDefinition, ParameterDescription } from '../parameters/parameter-models';
import { OptionDescription } from '../options/option-models';


/**
 * Options passed into the `HelpModule` allowing for custom implementations of the help message behavior
 *
 * @publicApi
 */
export interface HelpModuleOpts {

    /**
     * Custom implementation of the service that displays help messages for the usage commands. This is triggered when a command's execution
     * path has been resolved and a help error has been caught. By default, these errors would be `ParameterParsingError`, `OptionParsingError` or
     * `TypeCastingError` as these can only be thrown once a command has been resolved and its options/parameters are parsed. The default implementation
     * is the `DefaultCommandHelp` service
     */
    commands?: CommandHelp | Type<CommandHelp>;

    /**
     * Custom implementation of the service that displays help messages for the usage of modules. This is triggered when a
     * command cannot be resolved, where the user attempted to call a command that does not exist (throws `UnknownCommandError`)
     * or the user did not call any command from a particular module (throws `MissingCommandError`). The default implementation is
     * the `DefaultModuleHelp` service
     */
    modules?: ModuleHelp | Type<ModuleHelp>;

    /**
     * Errors that are caught by the HelpModule to trigger help messages. The default list is `ParameterParsingError`, `OptionParsingError`,
     * `TypeCastingError`, `MissingCommandError`, `UnknownCommandError`.
     */
    onErrors?: Type<any>[];

}

/**
 * The HelpModule can imported to catch certain errors and display informative messages to the user. The module comes with default behaviour, but this
 * can also be replaced by custom implementations throught the *HelpModule.customize()* function. These implementations are for displaying
 * help messages for commands and modules, implementing the `CommandHelp` and `ModuleHelp` interfaces respectively. The options that are caught by the
 * help module can also be configured through the *customize()* function.
 *
 * ```ts
 * // with default implementations
 * imports: [
 *   HelpModule
 * ]
 *
 * // with custom implementations
 * imports: [
 *   HelpModule.customize({
 *      commands: CustomCommandsHelp,
 *      modules: CustomModulesHelp,
 *      onErrors: [OptionParsingError, ParameterParsingError]
 *   })
 * ]
 * ```
 *
 * If imported the HelpModule exports these services, whether left as default or custom implementations, together with a `HelpUtilities` service
 * to expose this functionality to other areas of the application. The `Helputilities` service provides some utility functions that assist
 * constructing strings to display help messages
 *
 * ```ts
 * @Injectable()
 * class MyService {
 *
 *   constructor(
 *     @Inject(COMMAND_HELP) private commandHelp: CommandHelp,
 *     @Inject(MODULE_HELP) private moduleHelp: ModuleHelp,
 *     private helpUtils: HelpUtilities
 *   ) {}
 *
 * }
 * ```
 *
 * ### COMMAND HELP
 *
 * The command help is triggered when a command's execution path has been resolved and a help error has been caught. By default,
 * these errors would be `ParameterParsingError`, `OptionParsingError` or `TypeCastingError` as these can only be
 * thrown once a command has been resolved and its' options/parameters are parsed. The default implementation
 * is the `DefaultCommandHelp` service
 *
 * #### Default Implementation: When the command is not a star command
 * For simple commads, details of the applicable options and parameters are displayed, including whether these are required,
 * the descriptons and whether the options require values or can be utilized as boolean flags
 * ```sh
 * Error:
 * {ErrorMessage}
 *
 * Usage:
 * <cli-name> <parent-module-name>? <command> [options] [<parameters>]
 *
 * Options:
 * --{name}, -{alias}?     <value>?     *required?      {description | 'No description available'}
 * ...
 *
 * Parameters:
 * [<parameter-name>?]    {description | 'No description available'}
 * ...
 * ```
 * #### Default Implementation: When the command is a star command
 * When the command is a star command is displays a help message that is the same as the help message for a module, showing usage as both
 * an executable command as well as the underlying commands which can be executed from the 'module'.
 * ```sh
 * Error:
 * {ErrorMessage}
 *
 * Usage:
 * (1) <cli-name> <parent-module-name>? <command> [<subcommand>]? [options] <parameters>
 * (1) <cli-name> <parent-module-name>? <command> [options] [<parameters>]
 *
 * Options:
 * --{name}, -{alias}?     <value>?     *required?      {description | 'No description available'}
 * ...
 *
 * Parameters:
 * [<parameter-name>?]    {description | 'No description available'}
 *
 * Commands:
 * {command-name}, {command-alias}?    {description | 'No description available'}
 * ...
 *
 * ```
 * ### MODULE HELP
 *
 * This is triggered when a command cannot be resolved, where the user attempted to call a command that does not exist
 * (throws `UnknownCommandError`) or the user did not call any command from a particular module (throws `MissingCommandError`).
 * The default implementation is the `DefaultModuleHelp`
 *
 * #### Default Implementation: When the module does not contain a star command
 * When a module does not have a star command, it can only be called if preceeded by a valid command name. The help behavior therefore
 * display all commands within a module. It is important to note that a module can be a submodule or the root (the cli itself), as such all parent
 * modules are also displayed
 * ```sh
 * Error:
 * {ErrorMessage}
 *
 * Usage:
 * <cli-name> <module-name>? <command> [<subcommand>]? [options] <parameters>
 *
 * Commands:
 * {command-name}, {command-alias}?    {description | 'No description available'}
 * ...
 * ```
 * #### Default Implementation: When the module contains a star command
 * When the module contains a star command its usage both as an executable command and as a module with underlying commands is shown. The specifics
 * for the star command are also displayed, including details of its options and parameters similiar to what would be displayed for a typically command
 * help message
 * ```sh
 * Error:
 * {ErrorMessage}
 *
 * Usage:
 * (1) <cli-name> <module-name>? <command> [<subcommand>]? [options] <parameters>
 * (1) <cli-name> <module-name>? [options] [<parameters>]
 *
 * Options:
 * --{name}, -{alias}?     <value>?     *required?      {description | 'No description available'}
 * ...
 *
 * Parameters:
 * [<parameter-name>?]    {description | 'No description available'}
 *
 * Commands:
 * {command-name}, {command-alias}?    {description | 'No description available'}
 * ...
 * ```
 * @publicAPi
 */
@CliModule({
    providers: [
        HelpUtilities,
        { provide: COMMAND_HELP, useClass: DefaultCommandHelp },
        { provide: MODULE_HELP, useClass: DefaultModuleHelp },
        { provide: HELP_ERRORS, useValue: defaultHelpErrors }
    ],
    exports: [
        HelpUtilities,
        { provide: COMMAND_HELP, useClass: DefaultCommandHelp },
        { provide: MODULE_HELP, useClass: DefaultModuleHelp },
        { provide: HELP_ERRORS, useValue: defaultHelpErrors }
    ]
})
export class HelpModule {

    /**
     * Returns a HelpModule custom implementations
     * @param helpModuleOpts Options passed into the `HelpModule` allowing for custom implementations of the help message behavior
     */
    static customize(
        helpModuleOpts?: HelpModuleOpts
    ): ConfiguredModule {
        return {
            module: HelpModule,
            providers: helpModuleOpts ? [
                ...(helpModuleOpts.commands ? [HelpModule.createProvider(COMMAND_HELP, helpModuleOpts.commands)] : []),
                ...(helpModuleOpts.modules ? [HelpModule.createProvider(MODULE_HELP, helpModuleOpts.modules)] : []),
                ...(helpModuleOpts.onErrors ? [{ provide: HELP_ERRORS, useValue: helpModuleOpts.onErrors || [] }] : [])
            ] : [],
            exports: helpModuleOpts ? [
                ...(helpModuleOpts.commands ? [HelpModule.createProvider(COMMAND_HELP, helpModuleOpts.commands)] : []),
                ...(helpModuleOpts.modules ? [HelpModule.createProvider(MODULE_HELP, helpModuleOpts.modules)] : []),
                ...(helpModuleOpts.onErrors ? [{ provide: HELP_ERRORS, useValue: helpModuleOpts.onErrors || [] }] : [])
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
        classOrObject: any
    ) {
        return isConstructor(classOrObject)
            ? { provide: injectToken, useClass: classOrObject as Type<any> }
            : { provide: injectToken, useValue: classOrObject };
    }

    /**
     * Creates a new instance of the HelpModule
     * @param commandsHelp Implementation that displays messages for command usage
     * @param modulesHelp Implementation that displays messages for module usage
     * @param errors Errors that are caught by the help module
     * @param app Reference to the application context
     */
    constructor(
        @Inject(COMMAND_HELP) private commandsHelp: CommandHelp,
        @Inject(MODULE_HELP) private modulesHelp: ModuleHelp,
        @Inject(HELP_ERRORS) private errors: Type<any>[],
        private app: AppContext
    ) {
    }

    /**
     * Checks if the thrown error is captured by the help functionality, if so it calls the relevant help implementation
     * determining whether help should be shown for a command or module
     * @param moduleRef Module which is being executed
     * @param context The current execution context
     * @param parser The app's ParserModule
     * @param parentContexts Execution contexts further up the the execution path
     * @param error Error that was thrown
     */
    async handleHelpError<ErrorType extends Error>(
        moduleRef: ModuleRef,
        route: RegisteredRoute,
        error: ErrorType
    ): Promise<void> {
        const rootDescription = this.moduleDescription(null, moduleRef.rootModule);
        if (route) {
            const description = this.findDescription(rootDescription, moduleRef.rootModule, route);
            if (route.isCommand) {
                return await this.commandsHelp.showHelp(description as CommandDescription, error);
            } else {
                return await this.modulesHelp.showHelp(description as ModuleDescription, error);
            }
        } else {
            return await this.modulesHelp.showHelp(rootDescription, error);
        }
    }

    activeDescription(
        moduleRef: ModuleRef,
        route: RegisteredRoute
    ): CommandDescription  {
        const rootDescription = this.moduleDescription(null, moduleRef.rootModule);
        return this.findDescription(rootDescription, moduleRef.rootModule, route);
    }

    /**
     * Determines if an error should be caught by the help implementation
     * @param error Error that was thrown
     */
    isHelpError(
        error: any
    ): boolean {
        let isHelpError = false;
        this.errors.forEach((err) => {
            isHelpError = error instanceof err ? true : isHelpError;
        });
        return isHelpError;
    }

    /**
     * Creates a module or command description depending on the execution context
     * @param rootDescription Description of the root module
     * @param context Current execution context
     * @param parentContexts Execution contexts further up the the execution path
     */
    private findDescription<T extends ModuleDescription | CommandDescription>(
        rootDescription: ModuleDescription,
        rootModule: ModuleRef,
        route: RegisteredRoute
    ): T {
        let currentParent = rootModule;
        let currentDescription = rootDescription;
        route.parentModules
            .slice(1, route.parentModules.length)
            .forEach(parent => {
                const currentRoute = currentParent.routes.find(r => r.module && r.module.constructorRef === parent.constructorRef);
                currentDescription = currentDescription.subCommands.find(sub => (sub.alias && sub.alias === currentRoute.alias) || sub.name === currentRoute.path);
                currentParent = currentRoute.module;
            });
        if (route.isCommand) {
                return currentDescription.commands.find(c => (c.alias && c.alias === route.alias) || c.name === route.path) as T;
        } else {
            return currentDescription.subCommands.find(c => (c.alias && c.alias === route.alias) || c.name === route.path) as T;
        }
    }


    /**
     * Creates a description of a module for displaying help messages
     * @param route Route that the module belongs to if not the root module
     * @param moduleRef The module ref for the description
     * @param context The current execution context for attaining command options for the execution path
     * @param parser The ParserModule
     * @param parent Description of the parent module if not the root module
     */
    private moduleDescription(
        route: RegisteredRoute,
        moduleRef: ModuleRef,
        parent?: ModuleDescription
    ): ModuleDescription {
        const description: ModuleDescription = {
            parent,
            name: route ? route.path : this.app.name,
            description: route ? route.description : undefined,
            alias: route ? route.alias : undefined,
            data: route ? route.data : undefined,
            commands: [],
            subCommands: [],
        };

        description.commands = moduleRef.routes
            .filter(r => r.isCommand)
            .map(r => this.commandDescription(r, description));

        description.subCommands = moduleRef.routes
            .filter(r => !r.isCommand)
            .map(r => this.moduleDescription(r, r.module, description));

        return description;
    }

    /**
     * Creates a description of a command for showing help messages
     * @param route Route to which the command belongs
     * @param moduleRef Parent module of the command
     * @param context The current execution context for attaining command options for the execution path
     * @param parser The ParserModule
     * @param parent  Description of the parent module
     */
    private commandDescription(
        route: RegisteredRoute,
        parent?: ModuleDescription
    ): CommandDescription {
        return {
            parent,
            name: route.path,
            description: route.description,
            data: route.data,
            alias: route.alias,
            parameters: this.parameterDescriptions(route.command.parameters),
            options: this.optionDescriptions(route),

        };
    }

    /**
     * Creates descriptions of parameters for displaying help messages
     * @param parameters Parameter metadata for the command
     */
    private parameterDescriptions(parameters: ParameterDefinition[]): ParameterDescription[] {
        return parameters.map(def => ({
            name: def.name,
            description: def.description,
            index: def.index,
            optional: def.optional,
            isArray: def.isArray,
            data: def.data,
            designType: def.designType
        }));
    }

    /**
     * Creates descriptions of options for displaying help messages
     * @param command Command for which the options must be created
     * @param context The current execution context to attain all options relevant to the execution path
     * @param moduleRef The parent module of the command
     * @param parser The ParserModule
     */
    private optionDescriptions(
        route: RegisteredRoute
    ): OptionDescription[] {
        return route
            .getOptionsMetadata()
            .map(opt => ({
                description: opt.description,
                name: opt.name,
                alias: opt.alias,
                required: opt.required,
                designType: opt.designType,
                data: opt.data
            }));
    }

}
