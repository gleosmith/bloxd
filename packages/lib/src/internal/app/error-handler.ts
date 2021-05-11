
export const ERROR_HANDLER = Symbol('ERROR_HANDLER');

/**
 * Interface that describes the minimum requirements for the error handling behavoir.
 *
 * @publicApi
 */
export interface ErrorHandler {

    /**
     * Error handler that is called when a error is thrown within the cli application. Allows for synchronous and asynchronous implementations
     */
    onError: (err: Error) => (void | Promise<void>);

}
