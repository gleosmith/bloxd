
import { Injectable } from '../dependency-injection/injectable-decorator';
import { ArgumentsContext } from './arguments-context';
import { ParsedOption } from '../options/option-models';
import { Inject } from '../dependency-injection/inject-decorator';
import { ParserConfig, PARSER_CONFIG } from './parser-config';
import { threadId } from 'worker_threads';

/**
 * Inject token for the arguments parser implementation
 *
 * @publicAPi
 */
export const ARGS_PARSER = Symbol('ARGS_PARSER');

/**
 * Interface describing the requirements for an implementation of the parsing provider, which evaulates the raw cli arguments
 * into a form that can be used to match and resolve commands/subcommands, as well as validate and bind cli options and parameters.
 * The default implementation is the `DefaultArgumentsParser`. 
 *
 * @publicApi
 */
export interface ArgumentsParser {

    /**
     * Processes the raw cli arguments and returns a context from which commands/subcommands can matched and resolved. The context also
     * allows options and parameters to be validated and bound
     * @param rawArgs string array of raw cli arguments
     */
    parse(rawArgs: string[]): ArgumentsContext;

}

/**
 * The default implementation of the argument parsing behavior, `ArgumentsParser`. The default behaviour provides the following
 * functionality:
 * - All arguments prefixed with -- or - are taken as options [*create value `-v` `--s`*]
 * - Arguments immediately after options, not prefixed with dashes, are taken as the option's value [create *--prod --name `my-name` value*]
 * - Options that do not have a preceeding value are taken as option flags and will have a value equal to true
 * - Where the same option is provided twice it will have an array value [*create `-v` name `-v` name2*] := ['name', 'name2']
 * - Possible parameters are taken as arguments that are not an option or an option value [*`create` `value` -v --s my-name `value2`*]
 * - By default, possible commands are taken as all arguments before the first option [*`create` `value` -v --s my-name value2*]
 * - If the ParserConfig.allowCommandsAfterOptions is set to true then possible commands will be the same as possible parameters
 *
 * @publicApi
 */
@Injectable()
export class DefaultArgumentsParser implements ArgumentsParser {

    /**
     * Creates a new instance
     * @param config Parsing configuration for modifying the behavior
     */
    constructor(
        @Inject(PARSER_CONFIG) private config: ParserConfig
    ) {
    }

    /**
    * Processes the raw cli arguments and returns a context from which commands/subcommands can matched and resolved. The context also
    * allows options and parameters to be validated and bound
    * @param rawArgs string array of raw cli arguments
    */
    parse(rawArgs: string[]): ArgumentsContext {
        const options: ParsedOption[] = [];
        const utlisedIndices: number[] = [];
        let firstOptionIndex = -1;

        rawArgs.forEach((arg, index) => {
            if (utlisedIndices.indexOf(index) === -1) {
                if (arg.startsWith('-')) {

                    firstOptionIndex = firstOptionIndex === -1 ? index : firstOptionIndex;
                    utlisedIndices.push(index);
                    const isAlias = arg.substr(0, 2) !== '--';
                    
                    if(isAlias) {
                        const aliases = arg.substr(0, arg.indexOf('=') !== -1 ? arg.indexOf('=') : arg.length);
                        if(aliases.length > 2) {
                            for(let i = 1; i < aliases.length - 1; i++) {
                                this.addOption('-' + arg.substr(i,1), true, true, options)
                            }
                            arg = '-' + arg.substr(aliases.length - 1,1)
                        }
                    }

                    let value: any;
                    if (arg.indexOf('=') !== -1) {
                        value = arg.substring(arg.indexOf('=') + 1, arg.length);
                        arg = arg.substring(0, arg.indexOf('='));
                    } else if (index < rawArgs.length - 1) {
                        if (!rawArgs[index + 1].startsWith('-')) {
                            value = rawArgs[index + 1];
                            utlisedIndices.push(index + 1);
                        } else {
                            value = true;
                        }
                    } else {
                        value = true;
                    }

                    this.addOption(arg, value, isAlias, options)

                }
            }
        });
        const remainingArgs = rawArgs.filter((item, index) => utlisedIndices.indexOf(index) === -1);

        return {
            possibleCommands: this.getPossibleCommands(this.config.allowCommandsAfterOptions, firstOptionIndex, remainingArgs),
            possibleParameters: remainingArgs,
            options
        };
    }

    private addOption(arg: string, value: any, isAlias: boolean, options:  ParsedOption[]) {
        const existingOption = options.find(opt => opt.rawName === arg);
        if (existingOption) {
            if (existingOption.value instanceof Array) {
                existingOption.value.push(value);
            } else {
                existingOption.value = [existingOption.value, value];
            }
        } else {
            options.push({
                rawName: arg,
                cleanedName: isAlias ? arg.replace('-', '') : arg.replace('--', ''),
                isAlias,
                value
            });
        }
    }

    /**
     * Returns a list of possible commands
     * @param commandsAfterOpts Whether commands are allowed after options
     * @param firstOptionIndex Index of the first option
     * @param remainingArgs Arguments that are not options or option values
     */
    private getPossibleCommands(
        commandsAfterOpts: boolean,
        firstOptionIndex: number,
        remainingArgs: string[]
    ) {
        if (commandsAfterOpts) {
            return [...remainingArgs];
        }
        return firstOptionIndex !== -1 ? [...remainingArgs].splice(0, firstOptionIndex) : remainingArgs;
    }

}
