/**
 * A type that represents a class constructor
 * 
 * @publicApi
 */
export type Type<T> = new(...args: any[]) => T;

/**
 * A special error thrown for build errors
 */
export class CliBuildError extends Error {}

/**
 * Specific error type that is caught by the default behaviour of the HelpModule if it has been imported into the application. Thrown when the cli
 * expects a command from the parsed arguments.
 * @extends HelpError
 * @publicApi
 */
export class MissingCommandError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

/**
 * Specific error type that is caught by the default behaviour of the HelpModule if it has been imported into the application. Thrown when the cli
 * recieves a command from the parsed arguments but cannot match this to any commands within the relevant module.
 * @extends HelpError
 * @publicApi
 */
export class UnknownCommandError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

/**
 * Specific error type that is caught by the default behaviour of the HelpModule if it has been imported into the application.
 * Thrown when the user provides invalid options to a command
 * @extends HelpError
 * @publicApi
 */
export class OptionParsingError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

/**
 * Specific error type that is caught by the default behaviour of the HelpModule if it has been imported into the application.
 * Thrown when the user provides invalid positional parameters to a command
 * @extends HelpError
 * @publicApi
 */
export class ParameterParsingError extends Error {

    constructor(message?: string) {
        super(message);
    }
}
/**
 * Specific error type that is caught by the default behaviour of the HelpModule if it has been imported into the application.
 * Thrown when the user provides invalid positional parameters to a command
 * @extends HelpError
 * @publicApi
 */
export class TypeCastingError extends Error {

    constructor(message?: string) {
        super(message);
    }
}
