import { Injectable } from '../dependency-injection/injectable-decorator';
import { ParameterDefinition } from '../parameters/parameter-models';
import { getDuplicates } from '../common/utils';
import { CliBuildError } from '../common/cli-types';

/**
 * Service in the ParserModule that validates command metadata for the executed command
 */
@Injectable()
export class ParametersValidator {

    /**
     * Creates a new instance
     */
    constructor() {
    }

    /**
     * Validates command metadata ensuring that:
     * - Indices are sequential starting at 1
     * - No names are duplicated
     * - Optional parameters always come after required
     * @param definitions Parameter metdata for the executed command
     * @param commandName name of the exuted command for throwing informative errors
     */
    validate(
        definitions: ParameterDefinition[],
        commandName: string
    ): void {
        definitions = definitions.sort((a, b) => b.index > a.index ? -1 : 1);
        if (definitions.length) {
            this.isSequential(definitions, commandName);
            this.disctintNames(definitions, commandName);
            this.optionalsAfterRequired(definitions, commandName);
            this.nothingAfterArrays(definitions, commandName);
        }
    }

    /**
     * Ensures that parameter indices are sequential, starting at 1
     * @param definitions Parameter metdata for the executed command
     * @param commandName name of the exuted command for throwing informative errors
     */
    private isSequential(
        definitions: ParameterDefinition[],
        commandName: string
    ): void {
        definitions.forEach((def, index) => {
            if (def.index !== index + 1) {
                throw new CliBuildError(`Invalid parameters in ${commandName}: Parameter indices must be sequential beginning at index 1${this.printParameter(definitions)}`);
            }
        });
    }

    /**
     * Ensures that all parameters have distinct names
     * @param definitions Parameter metdata for the executed command
     * @param commandName name of the exuted command for throwing informative errors
     */
    private disctintNames(
        definitions: ParameterDefinition[],
        commandName: string
    ): void {
        if (getDuplicates(definitions, d => d.name).length) {
            throw new CliBuildError(`Invalid parameters in ${commandName}: Each parameter name should be unique ${this.printParameter(definitions)}`);
        }
    }

    /**
     * Ensures optional parameters are always after required
     * @param definitions Parameter metdata for the executed command
     * @param commandName name of the exuted command for throwing informative errors
     */
    private optionalsAfterRequired(
        definitions: ParameterDefinition[],
        commandName: string
    ): void {
        definitions.forEach((def, index, elements) => {
            if (def.optional) {
                if (elements.slice(index + 1).find(d => !d.optional)) {
                    throw new CliBuildError(`Invalid parameters in ${commandName}: Optional parameters cannot come before required${this.printParameter(definitions)}`);
                }
            }
        });
    }

    /**
     * Ensures that an array parameter is the last parameter index
     * @param definitions Parameter metadata for the executed command
     * @param commandName name of the executed command for throwing informative errors
     */
    private nothingAfterArrays(
        definitions: ParameterDefinition[],
        commandName: string
    ): void {
        definitions.forEach((def, index, elements) => {
            if (def.isArray) {
                if (index < elements.length - 1) {
                    throw new CliBuildError(`Invalid parameters in ${commandName}: Only one array parameter is allowed and that parameter should be at the last index${this.printParameter(definitions)}`);
                }
            }
        });
    }

    /**
     * Utility function that returns a readable description of the parameter metadata for more informative errors
     * @param definitions Parameter metadata for the executed command
     */
    private printParameter(
        definitions: ParameterDefinition[]
    ): string {
        return definitions.map(def => `\n\t- name=${def.name}, index=${def.index}, isOptional=${def.optional}, isArray=${def.isArray}`).join('');
    }

}
