import { Type } from '../common/cli-types';
import { CommandRoute, CommandRouteDefinition, SubModuleRouteDefinition } from './command-routes';
import { ConfiguredModule } from '../module/module-models';
import { Provider } from '../dependency-injection/providers';
import { isConstructor, validateUniqueValues } from '../common/utils';
import { getMetadata, MetadataKey } from '../common/meta-data';
import { Command, CommandDefinition } from './command-models';
import { RegisteredRoute } from './registered-route';

/**
 * A set of utility functions that assist working with routes and registered routes
 */
export class RouteUtils {

    /**
     * Determines whether a module export is a route
     * @param value type of export
     */
    static isRoute(
        value: Type<any> | CommandRoute | ConfiguredModule | Provider
    ): boolean {
        if (isConstructor(value)) {
            return !!getMetadata(MetadataKey.Command, value as Type<any>);
        } else {
            if (value) {
                return value.hasOwnProperty('path') && (value.hasOwnProperty('command') || value.hasOwnProperty('module'));
            }
            return false;
        }
    }

    /**
     * Checks for duplicate routes within a array by ensuring that there are no duplicate routes by name or by alias. Throws an error when
     * duplicates are found
     * @param routes List of routes to validate
     * @param moduleName The name of the module that has declared or exported the routes
     * @param isExports Whether the routes have are in the module's export metadata
     */
    static checkForDuplicates(routes: RegisteredRoute[], moduleName: string, isExports?: boolean) {
        validateUniqueValues(
            routes, route => route.path,
            (value) => `Invalid ${isExports ? 'exported' : 'commands'} in ${moduleName}: Two or more ${isExports ? 'exported' : ''} commands/subcommands exist with the same command name "${value}"`
        );
        validateUniqueValues(
            routes.filter(r => !!r.alias), route => route.alias,
            (value) => `Invalid ${isExports ? 'exported' : 'commands'} in ${moduleName}: Two or more ${isExports ? 'exported' : ''} commands/subcommands exist with the same command alias "${value}"`
        );
        return routes;
    }

    /**
     * Gets the command class from a command route
     * @param route route
     */
    static getCommand(route: CommandRoute): Type<Command> {
        return isConstructor(route) ? (route as Type<Command>) : (route as CommandRouteDefinition).command;
    }

    /**
     * Gets the module class from a command route
     * @param route route
     */
    static getModule(route: CommandRoute): Type<any> {
        return (route as SubModuleRouteDefinition).module;
    }

    /**
     * Determines whether a route is a command route or a sub command route
     * @param route route
     */
    static isCommand(route: CommandRoute): boolean {
        return !isConstructor(route) ? route.hasOwnProperty('command') : true;
    }

    /**
     * Gets the routes path
     * @param route route
     */
    static getPath(route: CommandRoute): string {
        return isConstructor(route) ?
            getMetadata<CommandDefinition>(MetadataKey.Command, route as Type<any>).name :
            (route as CommandRouteDefinition | SubModuleRouteDefinition).path;
    }

    /**
     * Gets the routes data property
     * @param route route
     */
    static getData(route: CommandRoute): any {
        if (isConstructor(route)) {
            return getMetadata<CommandDefinition>(MetadataKey.Command, route as Type<any>).data;
        } else {
            let data = (route as CommandRouteDefinition | SubModuleRouteDefinition).data;
            if (data === undefined && RouteUtils.isCommand(route)) {
                data = getMetadata<CommandDefinition>(MetadataKey.Command, RouteUtils.getCommand(route)).data;
            }
            return data;
        }
    }

    /**
     * Get the routes alias
     * @param route route
     */
    static getAlias(route: CommandRoute): string {
        return isConstructor(route) ?
            getMetadata<CommandDefinition>(MetadataKey.Command, route as Type<any>).alias :
            (route as CommandRouteDefinition | SubModuleRouteDefinition).alias;
    }

    /**
     * Gets the routes description
     * @param route route
     */
    static getDescription(route: CommandRoute): string {
        if (isConstructor(route)) {
            return getMetadata<CommandDefinition>(MetadataKey.Command, route as Type<any>).description;
        } else {
            let  description = (route as CommandRouteDefinition | SubModuleRouteDefinition).description;
            if (description === undefined && RouteUtils.isCommand(route)) {
                description = getMetadata<CommandDefinition>(MetadataKey.Command, RouteUtils.getCommand(route)).description;
            }
            return description;
        }
    }

    /**
     * Determines if two routes equal by comparing their modules and or commands
     * @param route1 Route to compare
     * @param route2 Route to compare
     */
    static equal(route1: CommandRoute, route2: CommandRoute): boolean {
        return (RouteUtils.getCommand(route1) === RouteUtils.getCommand(route2) && !!RouteUtils.getCommand(route1)) ||
        (RouteUtils.getModule(route1) === RouteUtils.getModule(route2) && !!RouteUtils.getModule(route1));
    }


}
