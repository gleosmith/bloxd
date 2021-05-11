import { Injectable } from '../dependency-injection/injectable-decorator';
import { CommandDescription } from '../command/command-models';
import { HelpUtilities } from './help-utilities';
import { ModuleDescription } from '../module/module-models';
import * as chalk from 'chalk';

/**
 * Inject token for the module help implementation
 *
 * @publicAPi
 */
export const MODULE_HELP = Symbol('MODULE_HELP');

/**
 * Interface that describes the implementation of the HelpModule that displays help messages for the usage
 * of a module. Accepts both synchronous and asynchronous implementations for interactive help implementations.
 * This is triggered when a command cannot be resolved, where the user attempted to call a command that does not exist
 * (throws `UnknownCommandError`) or the user did not call any command from a particular module (throws `MissingCommandError`).
 * The default implementation is the `DefaultModuleHelp`
 *
 * @publicAPi
 */
export interface ModuleHelp {

    /**
     * Method that is called when the module help is triggered, printing a description of how to use a module
     * @param moduleDescription Description of the module, including references to its command's and parent modules
     * @param error  Error that was thrown to trigger the help implementation
     */
    showHelp<ErrorType extends Error>(
        module: ModuleDescription,
        error?: ErrorType
    ): void | Promise<void>;

}

/**
 * The default implementation of the `ModuleHelp` service which displays the applicable error message and the module's usage
 * usage, including all applicable options and parameters. There are two different messages that can be displayed. The first
 * where the module contains a star command, printing usage of the star command as well as all other commands within the module.
 * The second where a module does not contain a star command.
 *
 * ### EXAMPLE
 *
 * #### When the module does not contain a star command
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
 * #### When the module contains a star command
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
@Injectable()
export class DefaultModuleHelp implements ModuleHelp {

    /**
     * Creates a new instance of the default module help
     * @param utils Utilitiy functions for printing help messages
     */
    constructor(
        private utils: HelpUtilities
    ) {
    }

    /**
     * Method that is called when the module help is triggered, printing a description of how to use a module
     * @param moduleDescription Description of the module, including references to its commands and parent modules
     * @param error  Error that was thrown to trigger the help implementation
     */
    showHelp<ErrorType extends Error>(
        moduleDescription: ModuleDescription,
        error?: ErrorType
    ): void {
        let output = '';
        output += error ? chalk.red(`\n*ERROR*\n${error.message}\n`) : '';
        const starCommand = moduleDescription.commands.find(c => c.name === '*');
        output += starCommand ? this.starCommandModule(moduleDescription, starCommand) : this.normalModule(moduleDescription);
        process.stderr.write(`${output}\n`);
    }

    /**
     * Prints a description of a module that contains a star command
     * @param moduleDescription Description of the module, including references to its commands and parent modules
     * @param starCommand  Error that was thrown to trigger the help implementation
     */
    private starCommandModule(
        moduleDescription: ModuleDescription,
        starCommand: CommandDescription
    ): string {
        let output = chalk.whiteBright('\nUsage:\n');
        output += `${chalk.yellow('(1)')} ${this.utils.singleLineModule(moduleDescription)}`;
        output += `\n${chalk.yellow('(2)')} ${this.utils.singleLineCommand(starCommand, true)}`;
        output += moduleDescription.commands.filter(c => c.name !== '*').length || moduleDescription.subCommands.length
            ? this.utils.moduleCommands(moduleDescription.commands, moduleDescription.subCommands)
            : '';
        return output;
    }

    /**
     * Prints a description of a module that does not contain a star command
     * @param moduleDescription Description of the module, including references to its command's and parent modules
     */
    private normalModule(
        moduleDescription: ModuleDescription,
    ): string {
        let output = chalk.whiteBright('\nUsage:\n');
        output += `${this.utils.singleLineModule(moduleDescription)}`;
        output += moduleDescription.commands.filter(c => c.name !== '*').length || moduleDescription.subCommands.length
            ? this.utils.moduleCommands(moduleDescription.commands, moduleDescription.subCommands)
            : '';
        return output;
    }

}
