import { Type } from '../common/cli-types';
import { Command } from './command-models';

export interface BaseCommandRoute {

    /**
     * Path or command name that is resolved to execute the command
     */
    path: string;

    /**
     * A shorthand form that can be utilized to call the command or sub command in addition to the command name. An example would be a command with the
     * name *'create'* and alias *'c'*. Specifiying this in the route or even ignoring this in the route will overwrite the metadata specified within the
     * command decorator if applicable
     */
    alias?: string;

    /**
     *  Describes the functionality of the command for use in generation of automated help through the `HelpModule`
     */
    description?: string;

    /**
     * A placeholder for custom metadata to be attached for use in a custom implementation of the `HelpModule`
     */
    data?: any;

}

/**
 * Command route that accepts a sub command module
 *
 * @publicApi
 */
export interface SubModuleRouteDefinition extends BaseCommandRoute {

    /**
     * Module class that contains sub commands that can be executed
     */
    module: Type<any>;

}

/**
 * Command route that accepts a command with the ability to overwrite the metadata from the command decorator
 *
 * @publicApi
 */
export interface CommandRouteDefinition extends BaseCommandRoute {

    /**
     * Command class to be executed for the route
     */
    command: Type<Command>;

}

/**
 * A executable path within a module that can either be a command class, a command route where the command metadata can be overwritten or a
 * sub command route that allows the nesting of commands through command modules
 *
 * @publicApi
 */
export type CommandRoute = Type<Command> | SubModuleRouteDefinition | CommandRouteDefinition;
