import { OptionParsingError } from '../common/cli-types';
import { OptionDefinition, ParsedOption } from '../options/option-models';
import { Injectable } from '../dependency-injection/injectable-decorator';
import { Inject } from '../dependency-injection/inject-decorator';
import { PARSER_CONFIG, ParserConfig } from './parser-config';
import { TYPE_CASTER, TypeCaster } from './type-caster';

/**
 * Inject token for the option parsing implementation
 *
 * @publicAPi
 */
export const OPTIONS_PARSER = Symbol('OPTIONS_PARSER');

/**
 * An option that has been validated, parsed and associated with metadata
 *
 * @publicApi
 */
export interface EvaluatedOption {

    /**
     * The option metadata
     */
    definition: OptionDefinition;

    /**
     * Option value parsed from the raw argument
     */
    value: any;

}

/**
 * Interface describing the requirements for an implementation of the option parsing behavior. Takes in the option metadata
 * specific to the executed command, together with parsed options evaulated from the `ArgumentsParser`. Its role is to validate and
 * associate the parsed options to the relevant metadata. The default implementation is the `DefaultOptionsParser`.
 *
 * @publicApi
 */
export interface OptionsParser {

    /**
     * Implementation of the option parsing behavior which takes in the option metadata specific to the executed command,
     * together with parsed options evaulated from the `ArgumentsParser`. Its role is to validate and associate
     * the parsed options to the relevant metadata. The default implementation is the `DefaultOptionsParser`.
     * @param definitions Option metadata specific to the executed command
     * @param options Options parsed from the raw cli arguments through the `ArgumentsParser`
     */
    parseOptions(
        definitions: OptionDefinition[],
        options: ParsedOption[]
    ): EvaluatedOption[];

}

/**
 * The default implementation of the `OptionsParser` which provides the following behavior:
 * - Throws an `OptionParsingError` when one or more parsed arguments do not have associated metadata
 * and *ParserConfig.ignoreUnknownOptions* is set to false
 * - Throws an `OptionParsingError` when no parsed options are found for options that have *required* metadata set to true
 * - Throws an `OptionParsingError` when the raw options contain the same option that called by both its name and
 * alias
 * - Validates and casts the option values through the `TypeCaster` where (a) the option's *typeChecks* metadata is set to true
 * (b) the option's *typeChecks* metadata is undefined (or unset) and the *ParserConfig.applyTypeCasting* is set to true
 *
 * @publicApi
 */
@Injectable()
export class DefaultOptionsParser implements OptionsParser {

    /**
     * Creates a new instance
     * @param config Parsing configuration for modifying the behavior
     * @param typeCaster Type casting implementation for validating and casting option values
     */
    constructor(
        @Inject(PARSER_CONFIG) private config: ParserConfig,
        @Inject(TYPE_CASTER) private typeCaster: TypeCaster,
    ) {
    }

    /**
    * Validates and associates parsed options with the relevant metadata
    * @param definitions Options metadata specific to the executed command
    * @param options Options parsed from the raw cli arguments through the `ArgumentsParser`
    */
    parseOptions(
        definitions: OptionDefinition[],
        options: ParsedOption[]
    ): EvaluatedOption[] {

        const unknownOptions: ParsedOption[] = [];
        const parsedOptions: EvaluatedOption[] = [];
        const remainingOptions = [...definitions];
        const foundOpts = [];

        definitions.forEach(def => {
            const opt = options.find(arg => (!!def.alias && arg.rawName === `-${def.alias}`) || arg.rawName === `--${def.name}`);
            if (opt) {
                this.noUseOfAliasAndName(options, def, opt);
                parsedOptions.push(this.parseOption(def, opt, this.config.applyTypeCasting));
                remainingOptions.splice(remainingOptions.indexOf(def), 1);
                foundOpts.push(opt);
            }
        });

        this.noMissingOptions(remainingOptions);
        this.noExtraOptions(
            options.filter(opt => foundOpts.indexOf(opt) === -1),
            this.config.ignoreUnknownOptions
        );
        return parsedOptions;
    }

    /**
     * Throws an `OptionParsingError` where there are remaining parsed options, without associated metadata, and these remaining options are not
     * allowed as specified in the *ParserConfig*
     * @param unknownOptions Parsed options that could not be assocated with metadata
     * @param allowed Whether unassociated options are permitted
     */
    private noExtraOptions(
        unknownOptions: ParsedOption[],
        allowed: boolean
    ): void {
        if (unknownOptions.length && !allowed) {
            throw new OptionParsingError(`Invalid options: You have provided one or more options that are not known in this context: ` +
                `${unknownOptions.map(opt => `${opt.rawName}`).join(', ')} `);
        }
    }

    /**
     * Throws an `OptionParsingError` where options that have *required* metadata cannot be associated with a parsed option
     * @param remainingOptions Option metadata not associated with a parsed option
     */
    private noMissingOptions(
        remainingOptions: OptionDefinition[]
    ): void {
        const missingOptions = remainingOptions.filter(opt => opt.required);
        if (missingOptions.length) {
            throw new OptionParsingError(`Invalid Options: You have not provided the following required options` +
                `${missingOptions.map((o, index) =>
                    `\n(${index + 1})  --${o.name}${o.designType !== Boolean ? '=<value>' : ''} | ${o.alias ? '-' + o.alias : ''}${o.designType !== Boolean ? '=<value>' : ''}`
                ).join('')}`);
        }
    }

    /**
     * Checks that the same option has not been provided by the user with both its name and alias metadata
     * @param options  All options parsed from the raw cli arguments through the `ArgumentsParser`
     * @param definition Option metadata for which the test will be performed
     * @param arg Parsed option that has already been associated with the metadata through either its name or alias
     */
    private noUseOfAliasAndName(
        options: ParsedOption[],
        definition: OptionDefinition,
        arg: ParsedOption
    ): void {
        const alternativeOption = options.find(opt => arg.isAlias ? opt.cleanedName === definition.name : opt.cleanedName === definition.alias);
        if (alternativeOption) {
            throw new OptionParsingError(`Invalid options: you have cannot provide the same option with both its name '--${definition.name}' ` +
                `and its alias '-${definition.alias}'`);
        }
    }

    /**
     * Returns the metadata and the associated parsed value for an option. Makes use of the `TypeCaster` implementation
     * where neccessary
     * @param definition Option metadata
     * @param arg Parsed option
     * @param castTypes Whether type casting is applied globally
     */
    private parseOption(
        definition: OptionDefinition,
        arg: ParsedOption,
        castTypes: boolean
    ): EvaluatedOption {

        const requiresTypeCasting = definition.typeChecks !== undefined ? definition.typeChecks : castTypes;
        let value = arg.value;
        if (requiresTypeCasting) {
            value = this.typeCaster.castOption(definition, arg);
        }

        return {
            definition,
            value
        };
    }

}
