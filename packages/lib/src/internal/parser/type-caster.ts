import { Type, TypeCastingError } from '../common/cli-types';
import { Injectable } from '../dependency-injection/injectable-decorator';
import { OptionDefinition, ParsedOption } from '../options/option-models';
import { ParameterDefinition } from '../parameters/parameter-models';
import { Int, FilePath } from './additional-types';
import * as fs from 'fs';
import { AppContext } from '../app/app-context';

/**
 * Inject token for the type casting implementation
 *
 * @publicApi
 */
export const TYPE_CASTER = Symbol('TYPE_CASTER');

/**
 * Interface that describes the requirements for the type casting behavior. The implementation must
 * be able to cast and validate both option and parameter values, taking in metadata and returning
 * the cast value. The default implementation is the `DefaultTypeCaster`.
 *
 * @publicApi
 */
export interface TypeCaster {

    /**
     * Validates a parsed option value and casts it to the type specified in the option metadata
     * @param defintion Option metadata
     * @param parsed Options parsed from the raw cli arguments
     */
    castOption(defintion: OptionDefinition, parsed: ParsedOption): any;

    /**
     * Validates a parsed parameter value and casts it to the type specified in the parameter metadata
     * @param defintion Parameter metadata
     * @param value Value parsed from the raw cli arguments
     */
    castParameter(defintion: ParameterDefinition, value: any): any;

}

/**
 * Default implementation of the `TypeCaster` which provides the following behavior:
 * - Ability to validate and cast the string, number, boolean, `Int`, `FilePath` types
 * - Other types will not be cast and returned their original values
 * - The `Int` type only accepts integers while numbers accept decimal places
 * - The `FilePath` is a special type which validates as string input to a valid file or directory,
 * returning an absolute and relative path once cast
 * - Booleans accept the strings *'true'* or *'false'* and *'0'* or *'1'*
 */
@Injectable()
export class DefaultTypeCaster implements TypeCaster {

    /**
     * Creates a new instance
     * @param process Process that provides access the cwd
     */
    constructor(
        private process: AppContext
    ) {
    }

    /**
     * Validates a parsed option value and casts it to the type specified in the option metadata
     * @param defintion Option metadata
     * @param value Option parsed from the raw cli arguments
     */
    castOption(defintion: OptionDefinition, arg: ParsedOption) {
        try {
            return this.cast(arg.value, defintion.designType, true);
        } catch (e) {
            if (e instanceof Error) {
                throw new TypeCastingError(`Invalid value '${this.printValue(arg.value)}' for option --${defintion.name} ${defintion.alias ? `[-${defintion.alias}]` : ''}. ${e.message}`);
            }
        }
    }

    /**
     * Validates a parsed parameter value and casts it to the type specified in the parameter metadata
     * @param defintion Parameter metadata
     * @param value Value parsed from the raw cli arguments
     */
    castParameter(defintion: ParameterDefinition, value: any) {
        try {
            return this.cast(value, defintion.designType, false);
        } catch (e) {
            if (e instanceof Error) {
                throw new TypeCastingError(`Invalid value '${this.printValue(value)}' for parameter ${defintion.name} [positional index ${defintion.index}] . ${e.message}`);
            }
        }
    }

    /**
     * Returns a string of the value, with pretty formatting if it is an array
     * @param value Value to be printed
     */
    private printValue(value: any) {
        if (value instanceof Array) {
            return `[${value.map(v => `'${v}'`).join(', ')}]`;
        } else {
            return String(value);
        }
    }

    /**
     * Validates and casts a value based on its design type
     * @param value Value to be cast
     * @param designType Constructor of the design type
     * @param isOption Whether the cast is for an option
     */
   cast(value: any, designType: Type<any>, isOption: boolean): any {
        switch (designType) {
            case String:
                return this.castString(value, isOption);
            case Number:
                return this.castNumber(value, isOption);
            case Int:
                return this.castInt(value, isOption);
            case Boolean:
                return this.castBoolean(value, isOption);
            case FilePath:
                return this.castFilePath(value);
            default:
                return value;
        }
    }

    /**
     * Casts to a string
     * @param value Value to be cast
     * @param isOption Whether the cast is for an option
     */
    castString(value: any, isOption: boolean) {
        const type = typeof value;
        if (type === 'string' || type === 'number') {
            return String(value);
        } else {
            throw new TypeCastingError(`This ${isOption ? 'option' : 'parameter'} only accepts strings`);
        }
    }

    /**
     * Casts to a file path
     * @param value Value to be cast
     */
    castFilePath(value: any): FilePath {
        const originalPath = String(value);
        const filePath = new FilePath(originalPath, process.cwd());
       
        if (!fs.existsSync(filePath.absolute)) {
            throw new TypeCastingError('The provided path is not a valid file or directory');
        }
        return filePath;
    }

    /**
     * Casts to a number that allows decimal places
     * @param value Value to be cast
     * @param isOption Whether the cast is for an option
     */
    castNumber(value: any, isOption: boolean): number {
        if (/^[-]?[0-9]+(.[0-9]+)?$/.test(String(value))) {
            return Number(value);
        } else {
            throw new TypeCastingError(`This ${isOption ? 'option' : 'parameter'} only accepts numbers`);
        }
    }

    /**
     * Casts to a number that does not allow decimal places
     * @param value Value to be cast
     * @param isOption Whether the cast is for an option
     */
    castInt(value: any, isOption: boolean): number {
        if (/^[-]?[0-9]+$/.test(String(value))) {
            return Math.round(Number(value));
        } else {
            throw new TypeCastingError(`This ${isOption ? 'option' : 'parameter'} only accepts integers`);
        }
    }

    /**
     * Casts to a boolean, accepting the strings *'true'* or *'false'* and *'0'* or *'1'*
     * @param value Value to be cast
     * @param isOption Whether the cast is for an option
     */
    castBoolean(value: any, isOption: boolean) {
        if (typeof value === 'boolean') {
            return value;
        } else {
            if (String(value).toLowerCase() === 'true') {
                return true;
            } else if (String(value).toLowerCase() === 'false') {
                return false;
            } else if (String(value) === '1') {
                return true;
            } else if (String(value) === '0') {
                return false;
            }
            if (isOption) {
                throw new TypeCastingError('This option is a boolean flag and therefore does not take a value');
            } else {
                throw new TypeCastingError(`This parameter only accepts boolean which can be 0 or 1, true or false`);
            }
        }
    }

}
