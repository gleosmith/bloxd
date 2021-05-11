
import { ParameterDefinition } from '../parameters/parameter-models';
import { Injectable } from '../dependency-injection/injectable-decorator';
import { Inject } from '../dependency-injection/inject-decorator';
import { PARSER_CONFIG, ParserConfig } from './parser-config';
import { TYPE_CASTER, TypeCaster } from './type-caster';
import { ParameterParsingError } from '../common/cli-types';

/**
 * Inject token for the parameter parser implementation
 *
 * @publicAPi
 */
export const PARAMETERS_PARSER = Symbol('PARAMETERS_PARSER');

/**
 * An parameter that has been validated, parsed and associated with metadata
 *
 * @publicApi
 */
export interface EvaluatedParameter {

    /**
     * The parameter metadata
     */
    definition: ParameterDefinition;

    /**
     * The value parsed from the raw cli argument
     */
    value: any;

}

/**
 * Interface describing the requirements for an implementation of the parameter parsing behavior. Takes in the parameter metadata
 * specific to the executed command, together with parameter values. Its role is to validate and associate the parameter values
 * to the relevant metadata. The default implementation is the `DefaultParameterParser`.
 *
 * @publicApi
 */
export interface ParameterParser {

    /**
     * Implementation of the parameter parsing behaviour that takes in the parameter metadata specific to the executed command,
     * together with parameter values. Its role is to validate and associate the parameter values to the relevant metadata. The
     * default implementation is the `DefaultParameterParser`.
     * @param definitions Parameter metadata specific to the executed command
     * @param parameters parameter values taken from the raw cli arguments after options and commands have been resolved
     */
    parseParameters(definitions: ParameterDefinition[], parameters: string[]): EvaluatedParameter[];

}

/**
 * Default implementation of the `ParameterParser` which provides the following behavior:
 * - Throws `ParameterParsingError` when required parameters a missing
 * - Throws `ParameterParsingError` when too many parameters have been provided and *ParserConfig.ignoreUnknownParameters* is false
 * - Validates and casts parameter values through the `TypeCaster` where (a) the parameter's *typeChecks* metadata is set to true
 * (b) the parameter's *typeChecks* is undefined (unset) and the *ParserConfig.applyTypeCasting* is set to true
 *
 * @publicApi
 */
@Injectable()
export class DefaultParameterParser implements ParameterParser {

    /**
     * Creates a new instance
     * @param config Parsing configuration for modifying the behavior
     * @param typeCaster Type casting implementation for validating and casting parameter values
     */
    constructor(
        @Inject(PARSER_CONFIG) private config: ParserConfig,
        @Inject(TYPE_CASTER) private typeCaster: TypeCaster
    ) {
    }

    /**
     * Validates and associates parameter values with the relevant metadata
     * @param definitions Parameter metadata specific to the executed command
     * @param parameters Parameters from the raw cli arguments after the commands and options have been resolved
     */
    parseParameters(definitions: ParameterDefinition[], parameters: string[]): EvaluatedParameter[] {

        const parsedParameters: EvaluatedParameter[] = [];

        let noOfArrayParameters = 0;
        for (let index = 0; index < parameters.length; index++) {
            if (definitions[index]) {
                if (definitions[index].isArray) {
                    noOfArrayParameters = (parameters.length - 1) - index;
                    parsedParameters.push(this.parseParameter(definitions[index], parameters.slice(index), this.config.applyTypeCasting));
                } else {
                    parsedParameters.push(this.parseParameter(definitions[index], parameters[index], this.config.applyTypeCasting));
                }
            }
        }


        const remainingDefinitions = definitions.slice(parsedParameters.length);
        const remainingParameters = parameters.slice(parsedParameters.length + noOfArrayParameters);
        const missingParameters = remainingDefinitions.filter(def => !def.optional);

        if (missingParameters.length) {
            throw new ParameterParsingError(`Missing parameters: ${missingParameters.map(o => o.name).join(', ')}`);
        }

        if (remainingParameters.length && !this.config.ignoreUnknownParameters) {
            throw new ParameterParsingError(`Unknown parameters: ${remainingParameters.join(', ')}`);
        }

        return parsedParameters;
    }

    /**
     * Returns the parameter metadata with its' parsed value. Makes use of the `TypeCaster` implementation
     * where neccessary
     * @param definition Parameter metadata
     * @param value Parameter value
     * @param castTypes Whether type casting is applied globally
     */
    private parseParameter(definition: ParameterDefinition, value: string | string[], castTypes: boolean): EvaluatedParameter {

        const requiresTypeCasting = definition.typeChecks !== undefined ? definition.typeChecks : castTypes;
        if (requiresTypeCasting) {
            value = this.typeCaster.castParameter(definition, value);
        }
        return {
            definition,
            value
        };
    }

}
