import {  OptionParsingError, ParameterParsingError, Type, MissingCommandError, UnknownCommandError, TypeCastingError } from '../common/cli-types';

/**
 * Inject token for the error messages that are caught by the help module
 *
 * @publicApi
 */
export const HELP_ERRORS = Symbol('HELP_ERRORS');

/**
 * Default errors that are caught by the help module
 */
export const defaultHelpErrors: Type<any>[] = [
    OptionParsingError,
    ParameterParsingError,
    TypeCastingError,
    MissingCommandError,
    UnknownCommandError
];
