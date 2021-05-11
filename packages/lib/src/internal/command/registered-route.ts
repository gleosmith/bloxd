import { CommandRef } from './command-ref';
import { Command } from './command-models';
import { ModuleRef } from '../module/module-ref';
import { RouteUtils } from './route-utils';
import { CommandRoute } from './command-routes';
import { OptionsLink } from '../options/options-link';
import { removeDuplicates } from '../common/utils';
import { OptionDefinition, MappedCliOptionDefinition } from '../options/option-models';


/**
 * A reference to a command route once it has been registered within an application
 */
export class RegisteredRoute {

    /**
     * Creates a registered route from a command route
     * @param route Command route
     * @param ref Reference to the executed component being a module or a command
     */
    static fromCommandRoute(route: CommandRoute, ref: ModuleRef | CommandRef): RegisteredRoute {
        return new RegisteredRoute({
            isCommand: RouteUtils.isCommand(route),
            command: RouteUtils.isCommand(route) ? ref as CommandRef : undefined,
            module: !RouteUtils.isCommand(route) ? ref as ModuleRef : undefined,
            path: RouteUtils.getPath(route),
            description: RouteUtils.getDescription(route),
            data: RouteUtils.getData(route),
            alias: RouteUtils.getAlias(route),
        });
    }

    /**
     * Creates a registered route from another registered route when a route is exported from one module into another
     * @param route Exported route
     * @param importModule Module that imported the route
     */
    static fromRegisteredRoute(route: RegisteredRoute, importModule: ModuleRef): RegisteredRoute {
        return new RegisteredRoute({
            ...route,
        }, importModule);
    }

    /**
     * Path or command name that is resolved to execute the command
     */
    path: string;

    /**
     * A shorthand form that can be utilized to call the command or sub command in addition to the command name. An example would be a command with the
     * name *'create'* and alias *'c'*. Specifiying this in the route or even ignoring this in the route will overwrite the metadata specified within the
     * command decorator if applicable
     */
    alias: string;

    /**
     *  Describes the functionality of the command for use in generation of automated help through the `HelpModule`
     */
    description: string;

    /**
     * A placeholder for custom metadata to be attached for use in a custom implementation of the `HelpModule`
     */
    data: any;

    /**
     * Reference to the command when the route is a command route
     */
    command?: CommandRef<Command>;

    /**
     * Reference to the module when the route is a module route
     */
    module?: ModuleRef<any>;

    /**
     * Whether the route is a command route
     */
    isCommand: boolean;

    /**
     * Reference to the module that exported the command route when it has been exported
     */
    exportModule?: ModuleRef;

    /**
     * A reference to all parent modules within the application graph , starting the direct parent or the importing parent
     */
    parentModules: ModuleRef[];


    /**
     * Creates a new instance of a registered route
     * @param route Route properties
     * @param importModule Module than imported the route if applicable
     */
    constructor(route: Partial<RegisteredRoute>, importModule?: ModuleRef) {
        this.path = route.path;
        this.command = route.command;
        this.description = route.description;
        this.alias = route.alias;
        this.isCommand = route.isCommand;
        this.data = route.data;
        this.module = route.module;

        const parentModule = importModule || (this.isCommand ? this.command.parent : this.module.parent);
        this.parentModules = [...(parentModule?.parents || []), parentModule];
        this.exportModule = importModule ? (this.isCommand ? this.command.parent : this.module.parent) : undefined;
    }

    /**
     * Returns all module references relevant to the route, begining with the exporting module (if applicable) and then
     * return the root module until the route
     */
    getModuleTree(): ModuleRef[] {
        return [
            ...(this.exportModule ? [this.exportModule] : []),
            ...this.parentModules,
            ...(!this.isCommand ? [this.module] : [])
        ];
    }

    /**
     * Returnns all option references relevant to the route including references supplied within the command itself, any of its parent modules or
     * within the exporting module
     */
    getOptions(): OptionsLink[] {
        return removeDuplicates(
            this.getModuleTree()
                .reduce((prev, cur) => [
                    ...prev,
                    ...cur.options
                ], [] as OptionsLink[])
                .concat(this.command ? this.command.options : []) as OptionsLink[],
            (link1, link2) => link1.constructorRef === link2.constructorRef
        );
    }

    /**
    * Returns all metadata from all option references relevant to the route including references supplied within the command itself, any of
    * its parent modules or within the exporting module
    * @param unique Whether duplicate metadata should be removed based on the alias, name, required status, design type and description
    */
    getOptionsMetadata(unique?: boolean) {

        const options = this.getOptions()
            .reduce((prev, cur) => [
                ...prev,
                ...cur.providerRef.optionsMetadata
            ], [] as OptionDefinition[]);

        if (unique) {
            return removeDuplicates(options, (item1, item2) =>
                item1.name === item2.name && item1.alias === item2.alias && item1.required === item2.required
                && item1.designType === item2.designType && item1.description === item2.description
            );
        }
        return options;
    }


    /**
     * Returns all option defintions in the execution path mapped to their class
     */
    getMappedOptions(): MappedCliOptionDefinition[] {
        return this
            .getOptions()
            .reduce((prev, cur) => [
                ...prev,
                ...cur.providerRef.optionsMetadata.map(def => ({ class: cur.constructorRef, def }))
            ], [] as MappedCliOptionDefinition[]);
    }



}
