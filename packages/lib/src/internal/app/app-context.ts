import * as process from 'process';
import * as path from 'path';
import { Inject } from '../dependency-injection/inject-decorator';


/**
 * Name of the Cli applciation
 */
export const CLI_NAME = Symbol('APP_NAME');

/**
 * Version of the cli application
 */
export const CLI_VERSION = Symbol('APP_VERSION');

/**
 * Injectable service that contains details of the applications context
 *
 * @publicApi
 */
export class AppContext {

    constructor(
        @Inject(CLI_NAME) private nameValue: string,
        @Inject(CLI_VERSION) private versionValue: string,
    ) {
    }

    /**
     * Name of the cli
     */
    get name() {
        return this.nameValue;
    }

    /**
     * Version of the CLI
     */
    get version() {
        return this.versionValue;
    }

    /**
     * Creates an absolute path by joing a relative path to the current working directory
     * @param file relative path
     */
    relativeToCwd(file: string) {
        return path.join(process.cwd(), file);
    }

    /**
     * Creates an absolute path by joining a relative path to the cli's directory
     * @param file relative path
     */
    relativeToCli(file: string) {
        return path.join(this.cliPath, file);
    }

    /**
     * The current working directory
     */
    get cwd() {
        return process.cwd()
    }

    /**
     * Path to node.js
     */
    get nodePath() {
        return process.argv[0];
    }

    /**
     * Path where the CLI script is located
     */
    get cliPath() {
        return path.join(process.argv[1], '../');
    }


}
