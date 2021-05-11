import { Injectable } from '../dependency-injection/injectable-decorator';
import { CommandDescription } from '../command/command-models';
import { HelpUtilities } from './help-utilities';
import * as chalk from 'chalk';

/**
 * Inject token for the command help implementation
 *
 * @publicAPi
 */
export const COMMAND_HELP = Symbol('COMMAND_HELP');

/**
 * Interface that describes the implementation of the HelpModule that displays help messages for the usage
 * of a command. Accepts both synchronous and asynchronous implementations for interactive help implementations.
 * This is triggered when a command's execution path has been resolved and a help error has been caught. By default,
 * these errors would be `ParameterParsingError`, `OptionParsingError` or `TypeCastingError` as these can only be
 * thrown once a command has been resolved and its' options/parameters are parsed. The default implementation
 * is the `DefaultCommandHelp` service
 *
 * ### EXAMPLE
 *
 * #### When the command is not a star command
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
 * #### When the command is a star command
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
 * @publicAPi
 */
export interface CommandHelp {

    /**
     * Method that is called when the command help is triggered.
     * @param command Description of the command
     * @param error Error that was thrown to trigger the help implementation
     */
    showHelp<ErrorType extends Error>(
        command: CommandDescription,
        error?: ErrorType
    ): void | Promise<void>;

}


/**
 * The default implementation of the `CommandHelp` service which displays the applicable error message and the command's
 * usage, including all applicable options and parameters
 *
 * @publicAPi
 */
@Injectable()
export class DefaultCommandHelp implements CommandHelp {

    /**
     * Creates a new instance
     * @param utils Utilitiy functions for printing help messages
     */
    constructor(
        private utils: HelpUtilities,
    ) {
    }

    /**
     * Method that is called when the command help is triggered, printing a description of how to use a command
     * @param command Description of the command
     * @param error Error that was thrown to trigger the help implementation
     */
    showHelp<ErrorType extends Error>(
        commandDescription: CommandDescription,
        error?: ErrorType
    ): void {
        let output = '';
        output += error ? chalk.red(`\n*ERROR*\n${error.message}\n`) : '';
        output += commandDescription.name === '*' ? this.starCommand(commandDescription) : this.normalCommand(commandDescription);
        process.stderr.write(`${output}\n`);
    }

    /**
     * Prints the usage of a star command
     * @param commandDescription Description of the command
     */
    private normalCommand(
        commandDescription: CommandDescription,
    ): string {
        let output = chalk.whiteBright(`\nUsage:\n`);
        output += `${this.utils.singleLineCommand(commandDescription, true)}`;
        output += commandDescription.parameters.length ? this.utils.commandParameters(commandDescription.parameters) : '';
        output += commandDescription.options.length ? this.utils.commandOptions(commandDescription.options) : '';
        return output;
    }

    /**
     * Prints the usage of a normal command
     * @param commandDescription Description of the command
     */
    private starCommand(
        command: CommandDescription,
    ): string {
        let output = chalk.whiteBright(`\nUsage:\n`);
        output += `${chalk.yellow('(1)')} ${this.utils.singleLineCommand(command, true)}`;
        output += `\n${chalk.yellow('(2)')} ${this.utils.singleLineModule(command.parent)}`;
        output += command.parameters.length ? this.utils.commandParameters(command.parameters) : '';
        output += command.options.length ? this.utils.commandOptions(command.options) : '';
        output += command.parent.commands.filter(c => c.name !== '*').length || command.parent.subCommands.length
            ? this.utils.moduleCommands(command.parent.commands, command.parent.subCommands)
            : '';
        return output;
    }

}
