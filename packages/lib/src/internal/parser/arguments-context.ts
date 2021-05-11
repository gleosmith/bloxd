import { ParsedOption } from '../options/option-models';
import { RegisteredRoute } from '../command/registered-route';


/**
 * Result of parsing the raw cli string arguments into a form that enables the framework to validate and
 * resolve the execution path, parameters and options. If a command/subcommand is resolved and matched to a command route it is stripped out
 * of the both the *ArgumentsContext.possibleParameters* and *ArgumentsContext.possibleCommands* properties before it begins to evaulate for a next step in
 * the execution path. As such, there should be an overlap between these two properties.
 *
 * @publicApi
 */
export interface ArgumentsContext {

    /**
     * Options parsed from the raw cli arguments
     */
    options: ParsedOption[];

    /**
     * Potential commands parsed from the raw cli arguments, which should overlap with potential parameters. Must
     * retain the order in which they were taken from the raw arguments
     */
    possibleCommands: string[];

    /**
     * Potential parameters parsed from the raw cli arguments, which should overlap with potential commands. Must
     * retain the order in which they were taken from the raw arguments
     */
    possibleParameters: string[];

}

/**
 * Result of a successful evaluation step in the cli execution path where a command/subcommand is matched and
 * resolved to a command route
 */
export interface EvaluatedArgumentsContext extends ArgumentsContext {

    /**
     * Route that was matched in the context and stripped out of the possibleCommands and possibleParameters for
     * evaluation of further steps
     */
    route: RegisteredRoute;

    /**
     * Potential commands remaining after stripped out those that have already been resolved to a command route
     */
    possibleCommands: string[];

    /**
     * Potential parameters remaining after the resolved command/subcommand routes have been stripped out
     */
    possibleParameters: string[];

}
