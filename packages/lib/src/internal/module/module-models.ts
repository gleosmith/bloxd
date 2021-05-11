
import { Type } from '../common/cli-types';
import { Provider } from '../dependency-injection/providers';
import { CommandDescription } from '../command/command-models';
import { CommandRoute, CommandRouteDefinition } from '../command/command-routes';

/**
 * Contains the metadata supplied to the @CliOptions decorator
 */
export class ModuleDefinition {

    /**
     * commands or sub commands within the module
     */
    commands: CommandRoute[];

    /**
     * list of providers to be included in the module’s dependency injection scope to be injected into other module components
     */
    providers: Provider[];

    /**
     * option containers which apply to all commands and or sub commands within the module
     */
    options: Type<any>[];

    /**
     * Other shared modules that export functionality to be consumed by this module
     */
    imports: ModuleImports;

    /**
     * Providers, options, commands or modules to share with other modules
     */
    exports: (Type<any> | ConfiguredModule | CommandRouteDefinition | Provider)[];

}


/**
 * A module class or a configured module that are accepted in the imports metadata of a module
 */
export type ModuleImports = (Type<any> | ConfiguredModule)[];

/**
 * Metadata supplied to the @CliModule() decorator which specifies the different component building blocks of the module
 * **options** - option which apply to all commands and or sub commands within the module
 * **commands** - commands or sub commands within the module
 * **providers** -  list of providers to be included in the module’s dependency injection scope to be injected into other module components
 * **imports** - shared modules that export functionality to be consumed by the module
 * **exports** - providers, options, commands or modules to share with other modules
 * @publicApi
 */
export interface CliModuleOpts {

    /**
     * commands or sub commands within the module
     */
    commands?: CommandRoute[];

    /**
     * list of providers to be included in the module’s dependency injection scope to be injected into other module components
     */
    providers?: Provider[];

    /**
     * option containers which apply to all commands and or sub commands within the module
     */
    options?: Type<any> | Type<any>[];

    /**
     * Other shared modules that export functionality to be consumed by this module
     */
    imports?: ModuleImports;

    /**
     * Providers, options, commands or modules to share with other modules
     */
    exports?: (Type<any> | ConfiguredModule | CommandRouteDefinition | Provider)[];

}

/**
 * A configured module references the class of a module and any additional components to include with that module's metadata. Configured modules provide a
 * mechanism to create 'parameterized' modules where not all of the modules metadata needs to be supplied through the @CliModule() decorator. The typical pattern for
 * configured modules is to return them from static functions of that module. An important characteristic of configured modules is that they are not singletons,
 * please see docs [link]
 * ```ts
 * @CliModule()
 * export class MyModule {
 *
 *   static customize(config: MyModuleConfig) {
 *     return {
 *       module: MyModule,
 *       providers: [config.customProvider],
 *       options: [config.customOptions],
 *       exports: [config.customProvider, config.customOptions]
 *     }
 *   }
 *
 * }
 * ```
 * @publicApi
 */
export interface ConfiguredModule extends CliModuleOpts {
    module: Type<any>;
}


/**
 * Description of a module, containing its route metadata and its context within the application including desciptions of
 * its commands, sub command modules and parent module (where applicable)
 * @publicApi
 */
export interface ModuleDescription<T = any> {

    /**
     * Description of the modules parent module where the module is a sub command module and not the root
     */
    parent: ModuleDescription;

    /**
     * Name that a user of the CLI can use to trigger the call the module and access the commands within it. If this is the root module
     * it will be the name of the cli itself, else it will be taken from the specified route
     */
    name: string;

    /**
     * Description of all commands within the module
     */
    commands: CommandDescription[];

    /**
     * Description of all sub command modules within the module
     */
    subCommands: ModuleDescription[];

    /**
     * A shorthand form, in additional to the module name, which can be used to call the module. This is taken from the sub command route
     * declaration, and is therefore not applicable to the root module
     */
    alias?: string;

    /**
     * Description of the module which is taken from the sub command route declaration. This is not applicable to the root module
     */
    description?: string;

    /**
     * Additional metadata taken from the sub command route declaration. This is not applicable to the root module
     */
    data?: T;

}
