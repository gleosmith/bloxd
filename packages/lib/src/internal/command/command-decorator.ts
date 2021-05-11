import { MetadataKey, setMetadata } from '../common/meta-data';
import { CommandDefinition, CommandOpts, Command } from './command-models';
import { registerInjectablesArgs } from '../dependency-injection/injectable-arg-definition';
import { arrayValue } from '../common/utils';

/**
 * Decorator that marks as class as a CLI command, providing metadata that allows the application to resolve and execute the command
 * when triggered. The metadata is also utilized to generate help messages when the `HelpModule` has been imported into the application.
 * The decorated class must implement the `Command` interface. Providers and option containers can be injected into a command's constructor.
 *
 * To be utilized within the application a command must be belong to a `CliModule`:
 * 1. Provided directly into a module's command metadata
 * 2. Provided into a module's command metadata through a command route allowing for the command name and other metadata to be modified
 * 3. Provided indirectly by importing a module that exports commands
 *
 * ### METADATA OPTIONS
 *
 * Additional metadata can be provided into the decorator:
 * - **alias:** A shorthand form that can be utilized to call the command in addition to the command name. An example would be a command with the
 * name *'create'* and alias *'c'*. Where a command is provided through a command route into a module, the alias will be overwritten regardless of whether it
 * has been specified within the route. Therefore, ommitting the alias from the route will remove the alias metadata from the command.
 * Refer below for more detail on command routes.
 * - **description:** Describes the functionality of the command for use in generation of automated help through the `HelpModule`. Where a command is provided 
 * through command route into a module, the description will only be overwritten if it is provided into the route. Refer below for more detail on command routes.
 * - **data:** A placeholder for custom metadata to be attached for use in a custom implementation of the `HelpModule`.
 * - **options:** Command options, being classes decorated with `@CliOptions()`, provide command options that can be modified when the user calls
 * the command. Options can be provided at a command level, a module level or both. Providing options at a module level exposes those options to all
 * commands/subcommands within that module. Options are then injectable into these modules/commands depending on where they have been scoped.
 *
 * ### COMMAND ROUTES
 *
 * Command routes provide an alternative approach to include commands within a module with the ability to overwrite the metadata that has been included in the
 * decorator. This is particularily useful where third-party commands are used within a cli application as it allows the functionality of the command to
 * be utilized, but the metadata to be changed should there be a need to do so. Such a need could arise from requiring a different command name from that has been
 * used within the thrid-party command.
 *```ts
 * @CliCommand('create', {
 *   alias: 'c',
 *   description: 'Creates a new user'
 * })
 * export class CreateCommand implements Command {}
 *
 * @CliModule({
 *   commands: [
 *     CreateCommand,
 *     { path: 'create-user', command: CreateCommand},
 *   ]
 * })}
 * ```
 *
 * In addition to providing the capability to modify the command metadata, command routes also allow for the creation of subcommands or nested commands. For this a child module can
 * be provided into the route. The child modules can be deeply nested but cannot have circular dependencies.
 *```ts
 * @CliCommand('create', {
 *   alias: 'c',
 *   description: 'Creates a new database'
 * })
 * export class CreateCommand implements Command {}
 *
 * @CliModule({
 *   commands: [
 *     CreateCommand
 *   ]
 * })}
 * export class DatabaseModule {}
 *
 * @CliModule({
 *   commands: [
 *     { path: 'database', alias: 'db', description: 'APIs to modify the database', module: DatabaseModule }
 *   ]
 * })}
 * export class AppModule {}
 * ```
 * ### COMMAND TYPES
 *
 * *Commands can take three forms in which they can be called by the user*
 *
 * #### 1. Standard Commands
 * Where the command is part of the application's root module
 * - `<cli> *<command>* [options] [<parameters>]`
 * - `mycli *create* ---name peter`
 *
 * ```ts
 * @CliCommand('create', {
 *   ...opts
 * })
 * export class CreateCommand implements Command {}
 *
 * @CliModule({
 *   commands: [
 *     CreateCommand
 *   ]
 * })}
 * export class AppModule {}
 * ```
 *
 * #### 2. Subcommands (nested commands)
 * Where the command is included in a child module. Modules can be nested by providing a child module as a command route into a parent module.
 * Modules can be deeply nested but there can be no circular dependencies
 * - `<cli> *<command>* <subcommand> [options] [<parameters>]`
 * - `mycli db *create* --name peter`
 *
 ```ts
 * @CliCommand('create', {
 *   ...opts
 * })
 * export class CreateCommand implements Command {}
 *
 * @CliModule({
 *   commands: [
 *     CreateCommand
 *   ]
 * })}
 * export class DatabaseModule {}
 *
 * @CliModule({
 *   commands: [
 *     { path: 'db', module: DatabaseModule }
 *   ]
 * })}
 * export class AppModule {}
 * ```
 *
 * #### 3. Module commands (star commands)
 *
 * A star command a special type of command that is called by the user without specifying command name. It is therefore called using the cli name only
 * or using the path of its' parent module when nested. Star commands are implemented by using `*` as the command name. A star command can be utilized in
 * conjuction with normal "named" commands in a single module, as the application will first check if arguments parsed from the user match any of these named commands, if not
 * it will revert to the star command. There can only be one star command per module. The optional metadata, the `alias`, serves no purpose for star commands.
 * - `<cli> [options] [<parameters]`
 * - `mycli --name peter`
 *
 ```ts
 * @CliCommand('*', {
 *   ...opts
 * })
 * export class InitCommand implements Command {}
 *
 * @CliModule({
 *   commands: [
 *     InitCommand,
 *      // or { path: '*', command: InitCommand }
 *     CreateCommand
 *   ]
 * })}
 * export class AppModule {}
 * ```
 * @publicApi
 * @Annotation
 *
 * @param commandName Name of the command for usage in the CLI.
 * @param opts Additional command metadata
 */
export function CliCommand(commandName: string, opts?: CommandOpts): ClassDecorator {
    return function <T extends new (...args: any[]) => Command>(constructor: T) {
        setMetadata<CommandDefinition>(MetadataKey.Command, constructor, {
            constructor: constructor,
            name: commandName,
            alias: opts?.alias,
            options: arrayValue(opts?.options || []),
            description: opts?.description,
            providers: opts?.providers || [],
            data: opts?.data
        });
        registerInjectablesArgs(constructor);
    } as ClassDecorator;
}
