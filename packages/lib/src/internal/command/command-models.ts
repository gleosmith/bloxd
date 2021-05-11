import { Type } from '../common/cli-types';
import { ParameterDescription } from '../parameters/parameter-models';
import { OptionDescription } from '../options/option-models';
import { ModuleDescription } from '../module/module-models';
import { Provider } from '../dependency-injection/providers';

/**
 * Interface that must be implemented on all classes used as commands, decorated with `@CliCommand()`. A command must
 * at a minimum have an execute function that is called when the user triggers its use. Execution can be synchronous or
 * asynchronous. Where it is asynchronous the application will wait until the promise has resolved until it closes
 * ```ts
 * CliCommand('create', {
 *  ...opts
 * })
 * export class CreateCommand implements Command {
 *
 *      constructor() {}
 *
 *      async execute(): Promise<void> {
 *          // execute async work
 *      }
 *
 * }
 * ```
 *
 * @publicApi
 */
export interface Command {

    /**
     * Method that is called when the command is triggered. Can be synchronous or asynchronous
     */
    execute: () => void | Promise<any>;

}

/**
 * Command properties shared across multiple models
 */
interface BaseCommandProperties<T = any> {

    /**
     * A shorthand form that can be utilized to call the command in addition to the command name. An example would is a command with the
     * name *'create'* and alias *'c'*.
     */
    alias: string;

    /**
     * Describes the functionality of the command for use in the generation of automated help through the `HelpModule`.
     */
    description: string;

    /**
     * Command options, classes decorated with `@CliOptions()`, provide options that can be modified when the user calls
     * the command. These options become injectable into the command's constructor.
     */
    options?: Type<any> | Type<any>[];

    /**
     * A placeholder for custom metadata to be attached for use in a custom implementation of the `HelpModule`.
     */
    data: T;

    /**
     * Providers that are specific to the commands injection scope
     */
    providers: Provider[];

}

/**
 * Additional metadata that can be provided into the `@CliCommand()` decorator. Used by the application to resolve and execute the command.
 * Also used to generate automated help messages through the `HelpModule`.
 *
 * @publicApi
 */
export interface CommandOpts<T = any> extends Partial<BaseCommandProperties<T>> {
}

/**
 * Contains metadata that is attached to classes decorated with `@CliCommand()`. Used for internal purposes
 */
export interface CommandDefinition<T = any> extends BaseCommandProperties<T> {

    /**
     * Command name parsed into the `@CliCommand()` decorator
     */
    name: string;

    /**
     * Constructor of the decorated class
     */
    constructor: Type<any>;

    options: Type<any>[];

}

/**
 * Description of a command, containing its metadata and context within the application with descriptions of
 * the command's parameters, options and parent module
 *
 * @publicApi
 */
export interface CommandDescription<T = any> extends Omit<Partial<BaseCommandProperties<T>>, 'options'> {

    /**
     * Description of the direct parent module of the command. Where the command has been
     * exported from a module, the parent will be the module that imported this export module
     */
    parent: ModuleDescription;

    /**
     * Name that a user of the CLI can use to trigger the command. A special case is a star command `'*'` where the
     * user does not use the name to trigger the command
     */
    name: string;

    /**
     * Description of the command's parameters
     */
    parameters: ParameterDescription[];

    /**
     * Description of the options applicable to the command. This also includes all indirect options that have been
     * provided in any of the command's parent modules
     */
    options: OptionDescription[];

}
