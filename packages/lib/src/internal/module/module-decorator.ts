import { registerInjectablesArgs } from '../dependency-injection/injectable-arg-definition';
import { MetadataKey, setMetadata } from '../common/meta-data';
import { ModuleDefinition, CliModuleOpts } from './module-models';
import { arrayValue } from '../common/utils';

/**
 * Modules are a mechanism for constructing the application structure by decorating classes with @CliModule.
 * This decorator provides metadata that describes the components of the module, where components refer
 * to commands, services, options or other modules. There are four types of modules that can be used in the application.
 * - **Command Modules** - Command modules contain a subset of commands that can be executed by the user. This can take
 * two forms, the applications root module and sub command modules which lie beneath the other command modules.
 * With the exception of the root module, command modules are declared as a sub command modules within the commands metadata of a parent module.
 * - **Shared Modules** - Shared modules provide a means of sharing functionality across several modules by
 * exporting commands, services, options or other modules. Shared modules are declared in the import metadata of a parent module.
 * - **HelpModule** - The HelpModule is a special type of module that is able to catch certain errors to display automatic
 * help messages to the user when that have used the application incorrectly. This module is optional and comes with default behavior.
 * However, the custom implementations of the behavior can be provided through the HelpModule.customize function. 
 * - **ParserModule** - The ParserModule is another special type of module that is used to validate and parse the raw CLI arguments to
 * resolve commands and/or sub commands, as well as evaluate the options and parameters specific to the executed command. The ParserModule must be
 * imported within the applications root module. The ParserModule provides default behavior but this can be interchanged with custom implementations
 * through the ParserModule.forRoot function.
 *
 * ```ts
 * @CliModule({
 *   provides: [LoggerService],
 *   exports: [LoggerService]
 * })
 * export class LoggerModule {}
 *
 * @CliModule({
 * imports: [LoggerModule],
 * providers: [AppService],
 * commands: [
 *     CreateCommand,
 *     {path: 'db', module: DatabaseModule}
 *   ]
 * })
 * export class AppModule {}
 * ```
 * Command modules and shared modules have a different internal treatment for dependency injection.
 * While it is permitted to utilize a single module as both a command module and a shared module,  it is strongly advised to
 * design your modules for one of these use cases.
 *
 * ### Metadata
 * **options** - option which apply to all commands and or sub commands within the module
 * **commands** - commands or sub commands within the module
 * **providers** -  list of providers to be included in the module’s dependency injection scope to be injected into other module components
 * **imports** - shared modules that export functionality to be consumed by the module
 * **exports** - providers, options, commands or modules to share with other modules
 *
 * @publicApi
 * @param opts module components
 */
export function CliModule(opts: CliModuleOpts) {
    return function <T extends new (...args: any[]) => {}>(constructor: T) {
        setMetadata(MetadataKey.Module, constructor, {
            commands: opts.commands || [],
            providers: opts.providers || [],
            exports: opts.exports || [],
            options: arrayValue(opts.options),
            imports: opts.imports || [],
        } as ModuleDefinition);
        registerInjectablesArgs(constructor);
    };
}
