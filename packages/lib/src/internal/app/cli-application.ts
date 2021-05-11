import { CliBuildError } from './../common/cli-types';
import { ModuleRef } from './../module/module-ref';
import { ErrorHandler, ERROR_HANDLER } from './error-handler';
import { Type } from '../common/cli-types';
import { GlobalComponentsRegistry } from './global-components-registry';
import { AppContext, CLI_NAME, CLI_VERSION } from './app-context';
import { Provider } from '../dependency-injection/providers';
import { ProviderUtils } from '../dependency-injection/provider-utils';
import { isConstructor } from '../common/utils';
import chalk = require('chalk');

declare var __BLOXD_CLI_NAME__: string;
declare var __BLOXD_CLI_VERSION__: string;

/**
 * The Cli application responsible by validating and resolving the root module, as well as maintaining the global components registry
 *
 * @publicApi
 */
export class CliApp {

    /**
     * The global components registry for registering of different application components such as command, global providers, options e.t.c
     */
    private registry: GlobalComponentsRegistry;

    /**
     * The root module constructor
     */
    private root: Type<any>;

    /**
     * The module reference of the root module
     */
    private rootModule: ModuleRef;

    /**
     * Name of the Cli when set at the application level
     */
    private nameValue: string;

    /**
     * Version of the Cli when set at the application level
     */
    private versionValue: string;


    /**
     * Creates a new app instance
     * @param root constructor of the root module
     */
    constructor(root: Type<any>) {
        this.registry = new GlobalComponentsRegistry();
        this.root = root;
    }

    /**
     * Adds a provider to the global scope
     * @param provider provider to be registered
     */
    withGlobalProvider(provider: Provider) {
        this.registry.registerProvider(ProviderUtils.toProviderRef(provider, null, this.registry.providers));
        return this;
    }

    /**
     * Adds a provider to the global scope
     * @param provider provider to be registered
     */
    setErrorHandler(handler: ErrorHandler | Type<ErrorHandler>) {
        if (handler) {
            const provider = isConstructor(handler) ? { provide: ERROR_HANDLER, useClass: handler as Type<ErrorHandler> } : { provide: ERROR_HANDLER, useValue: handler };
            this.withGlobalProvider(provider);
        }
        return this;
    }

    /**
     * Overwrites the cli name, meaning that it cannot be changed through the name in the package.json or through the option in the build command
     */
    setName(name: string) {
        this.nameValue = name;
        return this;
    }

    /**
     * Overwrites the cli version, meaning that it cannot be changed through the name in the package.json or through the option in the build command
     */
    setVersion(version: string) {
        this.versionValue = version;
        return this;
    }

    /**
     * Executes the CLI application
     * @param args Overwrites arguments taken from process.argv
     */
    async execute(args?: string[]) {

        try {
            let globalName: string;
            try {
                globalName = __BLOXD_CLI_NAME__;
            } catch (e) { }

            let globalVersion: string;
            try {
                globalVersion = __BLOXD_CLI_VERSION__;
            } catch (e) { }

            this.withGlobalProvider({ provide: CLI_NAME, useValue: this.nameValue || (globalName || 'cli') });
            this.withGlobalProvider({ provide: CLI_VERSION, useValue: this.versionValue || (globalVersion || '1.0.0') });
            this.withGlobalProvider(AppContext);

            this.rootModule = this.registry.registerCommandModule(this.root, null);
            this.registry.resolveOptions();
            await this.rootModule.validate();
            await this.rootModule.execute(args || process.argv.slice(2));

        } catch (e) {
            const errorHandler = this.registry.providers.filter(p => p.injectToken === ERROR_HANDLER)[0];
            if (errorHandler) {
                await (errorHandler.resolve() as ErrorHandler).onError(e);
            } else {
                if (e instanceof CliBuildError) {
                    process.stderr.write(chalk.red(e.message))
                } else {
                    throw e
                }
            }
        }

    }

}

/**
 * A factory function that creates a new cli application
 * @param rootModule the root module of the application which must be decorated with CliModule
 * @publicApi
 */
export const createCli = (rootModule: Type<any>) => {
    return new CliApp(rootModule);
};
