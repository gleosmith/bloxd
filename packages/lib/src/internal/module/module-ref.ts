import { HelpContext } from './../help/help-context';
import { ValueProviderRef } from './../dependency-injection/provider-refs/value-provider-ref';
import { Type, MissingCommandError, UnknownCommandError, CliBuildError } from '../common/cli-types';
import { CommandRef } from '../command/command-ref';
import { MetadataKey, getMetadata, hasMetadata } from '../common/meta-data';
import { Injector } from '../dependency-injection/injector';
import { CommandHookDefinition } from './command-hooks';
import { ProviderRef } from '../dependency-injection/provider-refs/provider-ref';
import { asyncForEach, validateUniqueValues, isConstructor, asyncMap, } from '../common/utils';
import { ModuleDefinition, ConfiguredModule, ModuleImports } from './module-models';
import { Provider } from '../dependency-injection/providers';
import { ParserModule } from '../parser/parser-module';
import { EvaluatedArgumentsContext } from '../parser/arguments-context';
import { HelpModule } from '../help/help-module';
import { ProviderUtils } from '../dependency-injection/provider-utils';
import { ModuleUtils } from './module-utils';
import { Command } from '../command/command-models';
import { GlobalComponentsRegistry } from '../app/global-components-registry';
import { CommandRoute, CommandRouteDefinition } from '../command/command-routes';
import { RegisteredRoute } from '../command/registered-route';
import { RouteUtils } from '../command/route-utils';
import { OptionsLink } from '../options/options-link';

/**
 * An internal reference to a module that is responsable for creating the underlying module components and executing cli command calls
 */
export class ModuleRef<T = any> extends Injector<T> {

    /**
     * Parent injector of the module where the module is a sub command module and is not a shared module
     */
    parent: ModuleRef;

    /**
     * Providers within the module's dependency injection scope
     */
    providers: ProviderRef<any>[];

    /**
     * Both direct an imported routes within the module
     */
    routes: RegisteredRoute[];

    /**
     * Options supplied directly within the module or imported from other modules, that are applicable to all
     * commands and or sub commands within the module
     */
    options: OptionsLink[];

    /**
     * Providers that are shared with other modules that import this module
     */
    providerExports: ProviderRef[] = [];

    /**
     * Modules that are shared with other modules that import this module
     */
    moduleExports: ModuleRef[] = [];

    /**
     * Routes that are shared with other modules that import this module
     */
    routeExports: RegisteredRoute[] = [];

    /**
     * Options that are shared with other modules that import this module
     */
    optionExports: OptionsLink[] = [];

    /**
     * Instance of the module class
     */
    instance: T;

    /**
     * All module references imported into this module
     */
    imports: ModuleRef[];

    /**
     * Route resolved from the raw arguments
     */
    activeRoute: RegisteredRoute;

    /**
     * A reference to the global registry for registering imports, global provider, commands and options
     */
    private registry: GlobalComponentsRegistry;

    /**
     * Creates a new instance of the module ref and configures the components of the module
     * @param constructorRef Module class
     * @param registry The global components registery for modules, commands, options and global providers
     * @param parentModule Parent module where a sub command module
     * @param configuredModule Configured module where applicable
     */
    constructor(
        constructorRef: Type<any>,
        registry: GlobalComponentsRegistry,
        parentModule: ModuleRef,
        configuredModule?: ConfiguredModule,
    ) {
        super(constructorRef, registry.providers, parentModule);
        this.registry = registry;

        const definition = this.mergeConfiguredModule(getMetadata<ModuleDefinition>(MetadataKey.Module, constructorRef), configuredModule);
        if (!definition) {
            throw new CliBuildError(`The module ${constructorRef.name} is not a valid module, you may be missing the @CliModule() decorator`);
        }
        this.processImports(definition.imports, this.filterExports(definition.exports, 'modules'));
        this.processOptions(definition.options, this.filterExports(definition.exports, 'options'), this.imports);
        this.processProviders(definition.providers, this.filterExports(definition.exports, 'providers'), this.imports);
        this.processRoutes(definition.commands, this.filterExports(definition.exports, 'commands'), this.imports);
    }

    /**
     * Gets a reference to the root module
     */
    get rootModule(): ModuleRef {
        if (!this.parent) {
            return this;
        } else {
            return this.parent.rootModule;
        }
    }

    /**
     * All parents
     */
    get parents(): ModuleRef[] {
        if (this.parent) {
            return [...this.parent.parents, this.parent];
        }
        return [];
    }

    /**
     * Validates the module throught the parser module
     */
    async validate(): Promise<void> {
        const parserModule = await this.resolveParserModule(this.imports, this.parent);
        parserModule.validate(this);
    }

    /**
     * Attempts to resolve the cli call signature to a route in the module, continuing down the application graph until the call is matched to a
     * command route
     * @param rawArgsOrContext raw cli arguments or an evaluated context from a parent in the application graph
     */
    async execute(
        rawArgsOrContext: string[] | EvaluatedArgumentsContext,
    ): Promise<void> {

        const parentContext = rawArgsOrContext instanceof Array ? undefined : rawArgsOrContext;
        const parserModule = await this.resolveParserModule(this.imports, this.parent);
        const helpModule = await this.resolveHelpModule(this.imports, this.parent);
        const context = parserModule.evalauteContext(rawArgsOrContext, this.routes);

        try {
            if (context.route) {
                if (context.route.isCommand) {
                    if (!this.rootModule.activeRoute) {
                        this.rootModule.activeRoute = context.route;
                        this.registry.registerOrReplaceProvider(new ValueProviderRef(HelpContext, new HelpContext(context.route, this, helpModule), true));
                    }
                    await this.executeCommand(context, parserModule);
                } else {
                    await context.route.module.execute(context);
                }
            } else {
                if (context.possibleCommands.length) {
                    throw new UnknownCommandError(`Unknown command: No commands exist with the name '${context.possibleCommands[0]}'`);
                } else {
                    throw new MissingCommandError(`Expected a command`);
                }
            }
        } catch (e) {
            await this.handleError(e, helpModule, context.route || parentContext?.route);
        }
    }

    /**
     * Executes a command after instantiating all option containers and modules within the execution path, and triggered the command
     * hooks of the modules both before and after the command is executed
     */
    private async executeCommand(
        context: EvaluatedArgumentsContext,
        parserModule: ParserModule,
    ): Promise<void> {

        const parsedOptions = parserModule.evaulateOptions(context.route, context.options);
        await asyncForEach(context.route.getOptions(), async (opt) => await opt.providerRef.init(parsedOptions));
        const parsedParameters = parserModule.evaulateParameters(context.route.command.parameters, context.possibleParameters);

        const moduleInstances = await asyncMap(context.route.getModuleTree(), async m => await m.resolve());
        const commandInstance = await context.route.command.resolveWithParameters(parsedParameters);

        await this.handleCommandMiddleWare(moduleInstances, context.route.command, commandInstance, m => getMetadata(MetadataKey.BeforeExecute, m.__proto__.constructor) || []);
        await commandInstance.execute();
        await this.handleCommandMiddleWare(moduleInstances, context.route.command, commandInstance, m => getMetadata(MetadataKey.AfterExecute, m.__proto__.constructor) || []);
    }

    /**
     * Creates an instance of the module, adding the option providers to the modules injection scope if the function is called for the first time
     */
    async resolve() {
        if (!this.instance) {
            this.providers = [...this.providers, ...this.options.map(opt => opt.providerRef)];
            this.instance = await super.resolve();
        }
        return this.instance;
    }

    /**
     * Executes the command hooks on all modules within a command's execution path
     * @param moduleInstances Modules within the execution path
     * @param command Command that is going to be executed
     * @param commandInstance Instance of the command
     * @param defintionsFn Function that returns which hooks must be executed
     */
    private async handleCommandMiddleWare(
        moduleInstances: ModuleRef[],
        command: CommandRef,
        commandInstance: Command,
        defintionsFn: (modeleInstance: any) => CommandHookDefinition[]
    ): Promise<void> {
        await asyncForEach(moduleInstances, async (m) => {
            const defintions = defintionsFn(m);
            await asyncForEach(
                defintions.filter(def => !def.commands.length || def.commands.indexOf(command.constructorRef) !== -1),
                async (def) => await m[def.methodName]()
            );
        });
    }

    /**
     * Filters the module exports for a specific component type
     * @param moduleExports Module exports
     * @param type Component to filter for
     */
    private filterExports<ExportType>(
        moduleExports: (ConfiguredModule | Type<any> | CommandRoute | Provider)[],
        type: 'options' | 'modules' | 'commands' | 'providers'
    ): ExportType[] {
        return moduleExports.filter(exp => {
            switch (type) {
                case 'commands':
                    return RouteUtils.isRoute(exp);
                case 'options':
                    if (isConstructor(exp)) {
                        return !!getMetadata(MetadataKey.Options, exp as Type<any>);
                    }
                    return false;
                case 'providers':
                    if (isConstructor(exp)) {
                        if (!getMetadata(MetadataKey.Options, exp as Type<any>) && !RouteUtils.isRoute(exp) && !hasMetadata(MetadataKey.Module, exp as Type<any>)) {
                            return true;
                        }
                        return false;
                    }
                    return ProviderUtils.isProvider(exp);
                case 'modules':
                    if (!RouteUtils.isRoute(exp)) {
                        if (isConstructor(exp)) {
                            return !!getMetadata(MetadataKey.Module, exp as Type<any>);
                        } else {
                            return exp ? exp.hasOwnProperty('module') : false;
                        }
                    }
                    return false;

            }
        }) as any[];
    }

    /**
     * Registers the modules options, considering options declared directly within the metadata, options exported from the module and options imported
     * from other modules. Validates for duplicate declarations in both exports and imports. Registers the options in the global components registry
     * @param options Options declared directly in the options metadata
     * @param optionExports Options exported from the module
     * @param imports Imported modules
     */
    private processOptions(
        options: Type<any>[],
        optionExports: Type<any>[],
        imports: ModuleRef[]
    ): void {

        const optionWithoutDecorator = options.find(opt => !getMetadata(MetadataKey.Options, opt));
        if (optionWithoutDecorator) {
            throw new CliBuildError(`Invalid options in ${this.constructorRef.name}: The options class '${optionWithoutDecorator.name}' has not been decorated with @CliOptions`);
        }

        validateUniqueValues(options, opt => opt,
            constructorRef => `Invalid options in ${this.constructorRef.name}: The same option '${constructorRef.name}' has been included more than once`);

        validateUniqueValues(
            optionExports, opt => opt,
            (constructorRef) => `Invalid exports in ${this.constructorRef.name}: The same option has been exported more than once '${constructorRef.name}'`
        );

        this.options = [
            ...options
                .map(o => this.registry.registerOptions(o, this)),
            ...imports
                .reduce((prev, cur) => [
                    ...prev,
                    ...cur.optionExports
                        .filter(exp => !prev.find(() => exp.constructorRef !== exp.constructorRef))
                ], [] as OptionsLink[])
        ];

        this.optionExports = [
            ...this.options
                .filter(opt => !!optionExports.find(exprt => exprt === opt.constructorRef)),
            ...optionExports
                .filter(exprt => !this.options.find(opt => exprt === opt.constructorRef))
                .map(exprt => this.registry.registerOptions(exprt, this))
        ];

    }

    /**
     * Registers the providers modules providers, considering direct declarations, exports and imports. Providers declared and exported with the
     * same token are treated as a single provider. Validates for duplicate declarations
     * @param moduleProviders Providers declared directly in the modules metadata
     * @param providerExports Providers exported from the module
     * @param imports Imported modules
     */
    private processProviders(
        moduleProviders: Provider[],
        providerExports: Provider[],
        imports: ModuleRef[],
    ) {

        validateUniqueValues(
            moduleProviders, p => ProviderUtils.providerToken(p),
            (token) => `Invalid providers in ${this.constructorRef.name}: The module has declared two or more of the same provider '${ProviderUtils.providerName(token)}'`
        );

        validateUniqueValues(
            providerExports, p => ProviderUtils.providerToken(p),
            (token) => `Invalid exports in ${this.constructorRef.name}: The module has exported two or more of the same provider '${ProviderUtils.providerName(token)}'`
        );

        this.providers = moduleProviders
            .filter(p => !ProviderUtils.isGlobal(p))
            .map(p => ProviderUtils.toProviderRef(p, this, this.registry.providers));

        this.providers = [
            ...this.providers,
            ...imports
                .reduce((prev, cur) => [...prev, ...cur.providerExports], [] as ProviderRef[])
                .filter(imprt => !this.providers.find(p => p.injectToken === imprt.injectToken))
        ];

        moduleProviders
            .filter(p => ProviderUtils.isGlobal(p))
            .forEach(p => this.registry.registerProvider(ProviderUtils.toProviderRef(p, this, this.registry.providers)));

        providerExports
            .filter(exp => !this.providers.find(p => p.injectToken === ProviderUtils.providerToken(exp)))
            .filter(p => ProviderUtils.isGlobal(p))
            .forEach(p => this.registry.registerProvider(ProviderUtils.toProviderRef(p, this, this.registry.providers)));

        this.providerExports = [
            ...this.providers
                .filter(p => !!providerExports.find(exp => ProviderUtils.providerToken(exp) === p.injectToken)),
            ...providerExports
                .filter(exp => !this.providers.find(p => p.injectToken === ProviderUtils.providerToken(exp)))
                .filter(exp => !ProviderUtils.isGlobal(exp))
                .map(exp => ProviderUtils.toProviderRef(exp, this, this.registry.providers))
        ];

        validateUniqueValues(
            this.providers, p => p.injectToken,
            (token) => `The module '${this.constructorRef.name}' has imported two or more modules that export the same provider '${ProviderUtils.providerName(token)}'`
        );

    }

    registerProviders(providers: Provider[], parent: Injector) {
        providers
            .filter(p => ProviderUtils.isGlobal(p))
            .forEach(p => this.registry.registerProvider(ProviderUtils.toProviderRef(p, parent, this.registry.providers)));

        return providers
            .filter(p => !ProviderUtils.isGlobal(p))
            .map(p => (ProviderUtils.toProviderRef(p, parent, this.registry.providers)));
    }


    /**
     * Registers the imported modules, registering shared modules with the global component registry. Where the same module is imported and exported both declarations
     * refer to the same module
     * @param imports Imports declared in the modules metadata
     * @param moduleExports Modules exported from the module
     */
    private processImports(
        imports: ModuleImports,
        moduleExports: ModuleImports
    ): void {

        validateUniqueValues(
            imports, imprt => ModuleUtils.constructorRef(imprt),
            (constructorRef) => `Invalid imports in ${this.constructorRef.name}: The same module has been imported more than once '${constructorRef.name}'`
        );

        validateUniqueValues(
            moduleExports, imprt => ModuleUtils.constructorRef(imprt),
            (constructorRef) => `Invalid exports in ${this.constructorRef.name}: The same module has been exported more than once '${constructorRef.name}'`
        );

        this.imports = imports.map(imprt => {
            const constructorRef: Type<any> = isConstructor(imprt) ? (imprt as Type<any>) : (imprt ? (imprt as ConfiguredModule).module : null);
            if (constructorRef) {
                if (!getMetadata(MetadataKey.Module, constructorRef)) {
                    throw new CliBuildError(`Invalid imports in ${this.constructorRef.name}: The import ${constructorRef.name} is not a valid module, are you missing the @CliModule() decorator?`);
                }
            } else {
                throw new CliBuildError(`Invalid imports in ${this.constructorRef.name}: You cannot import a null or undefined value`);
            }
            return this.registry.registerSharedModule(imprt);
        });

        this.imports = [
            ...this.imports,
            ...this.imports
                .reduce((prev, cur) => [
                    ...prev,
                    ...cur.moduleExports.filter(exprt =>
                        ![...this.imports, ...prev].find(exprt2 => exprt2.constructorRef === exprt.constructorRef)
                    )
                ], [] as ModuleRef[])
        ];

        this.moduleExports = [
            ...this.imports
                .filter(imprt =>
                    !!moduleExports.find(exp => ModuleUtils.constructorRef(exp) === imprt.constructorRef)
                ),
            ...moduleExports
                .filter(exp =>
                    !this.imports.find(imprt => ModuleUtils.constructorRef(exp) === imprt.constructorRef)
                ).map(exp => this.registry.registerSharedModule(exp))
        ];

    }

    /**
     * Registers the modules routes, considering imports and exports. Instantiates and registers command modules in global components registry
     * @param commands Commands declared directly in the modules metadata
     * @param exportedCommands Commands exported from the module
     * @param imports Imported modules
     */
    private processRoutes(
        commands: CommandRoute[],
        exportedCommands: CommandRoute[],
        imports: ModuleRef[],
    ): void {

        this.routes = [
            ...commands
                .filter(route => RouteUtils.isCommand(route))
                .map(route =>
                    RegisteredRoute.fromCommandRoute(route, this.registry.registerCommand(RouteUtils.getCommand(route), this))
                ),
            ...commands
                .filter(route => !RouteUtils.isCommand(route))
                .map(route =>
                    RegisteredRoute.fromCommandRoute(route, this.registry.registerCommandModule(RouteUtils.getModule(route), this))
                ),
            ...imports
                .reduce((prev, cur) => [
                    ...prev,
                    ...cur.routeExports
                ], [] as RegisteredRoute[])
                .map(route => RegisteredRoute.fromRegisteredRoute(route, this))
        ];

        const newCommandExports = exportedCommands.filter(exp =>
            !this.routes.find(route =>
                route.isCommand && route.command.constructorRef === RouteUtils.getCommand(exp) ||
                !route.isCommand && route.module.constructorRef === RouteUtils.getModule(exp)
            )
        );

        this.routeExports = [
            ...this.routes
                .filter(route =>
                    !!exportedCommands.find(exp =>
                        route.isCommand && route.command.constructorRef === RouteUtils.getCommand(exp) ||
                        !route.isCommand && route.module.constructorRef === RouteUtils.getModule(exp)
                    )
                ),
            ...newCommandExports
                .filter(route => RouteUtils.isCommand(route))
                .map(route =>
                    RegisteredRoute.fromCommandRoute(route, this.registry.registerCommand(RouteUtils.getCommand(route), this))
                ),
            ...newCommandExports
                .filter(route => !RouteUtils.isCommand(route))
                .map(route =>
                    RegisteredRoute.fromCommandRoute(route, this.registry.registerCommandModule(RouteUtils.getModule(route), this))
                )
        ];

        RouteUtils.checkForDuplicates(this.routeExports, this.constructorRef.name, true);
        RouteUtils.checkForDuplicates(this.routes, this.constructorRef.name);
    }

    /**
     * Merges the components specified in a configured module with the modules metadata, filtering out direct declarations of the components that are also
     * supplied with the configured module
     * @param definition The modules original metadata
     * @param configuredModule The configured module to merge with the metadata
     */
    private mergeConfiguredModule(
        definition: ModuleDefinition,
        configuredModule: ConfiguredModule
    ): ModuleDefinition {
        if (configuredModule) {

            const configureProviders = configuredModule.providers || [];
            definition.providers = [
                ...definition.providers.filter(p1 => !configureProviders.find(p2 => ProviderUtils.equal(p1, p2))),
                ...configureProviders
            ];

            const configuredOptions: Type<any>[] = configuredModule.options instanceof Array ? configuredModule.options : (configuredModule.options ? [configuredModule.options] : []);
            definition.options = [
                ...definition.options.filter(opt1 => !configuredOptions.find(opt2 => opt2 === opt1)),
                ...configuredOptions
            ];

            const configuredImports = configuredModule.imports || [];
            definition.imports = [
                ...definition.imports.filter(m1 => !configuredImports.find(m2 => ModuleUtils.equal(m1, m2))),
                ...configuredImports
            ];

            const configuredCommands: CommandRoute[] = configuredModule.commands || [];
            definition.commands = [
                ...definition.commands.filter(c1 => !configuredCommands.find(c2 => RouteUtils.equal(c1, c2))),
                ...configuredCommands
            ];

            const configuredExports: (CommandRouteDefinition | Type<any> | Provider | ConfiguredModule)[] = configuredModule.exports || [];
            definition.exports = [
                ...this.filterExports<CommandRoute>(definition.exports, 'commands').filter(ex1 =>
                    !this.filterExports<CommandRoute>(configuredExports, 'commands').find(ex2 => RouteUtils.equal(ex2, ex1))
                ),
                ...this.filterExports<Type<any> | ConfiguredModule>(definition.exports, 'modules').filter(ex1 =>
                    !this.filterExports<Type<any> | ConfiguredModule>(configuredExports, 'modules').find(ex2 => ModuleUtils.equal(ex1, ex2))
                ),
                ...this.filterExports<Type<any>>(definition.exports, 'options').filter(ex1 =>
                    !this.filterExports<Type<any>>(configuredExports, 'options').find(ex2 => ex1 === ex2)
                ),
                ...this.filterExports<Provider>(definition.exports, 'providers').filter(ex1 =>
                    !this.filterExports<Provider>(configuredExports, 'providers').find(ex2 => ProviderUtils.equal(ex1, ex2))
                ),
                ...configuredExports
            ];
        }
        return definition;
    }



    /**
     * Retrieves and validates that the parser module is supplied in the root module. When valid it returns an instance of
     * the parse module
     * @param imports The modules imports
     * @param parentModule Parent module of the current module
     */
    private async resolveParserModule(
        imports: ModuleRef[],
        parentModule: ModuleRef
    ): Promise<ParserModule> {
        const parserModule = imports.find(m => m.constructorRef === ParserModule) as ModuleRef<ParserModule>;
        if (parentModule && parserModule) {
            throw new CliBuildError('ParserModule: The ParserModule can only be imported into the root module');
        } else if (parentModule) {
            return this.resolveParserModule(parentModule.imports, parentModule.parent);
        } else if (parserModule) {
            return parserModule.resolve();
        } else {
            throw new CliBuildError('ParserModule: The ParserModule must be imported into the root module');
        }
    }

    /**
     * Looks to find a help module in the current module, else it looks for the help module in parent modules. Where a module
     * is found it returns an instance of the module, else it returns null
     * @param imports The modules imports
     * @param parentModule Parent module of the current module
     */
    private async resolveHelpModule(
        imports: ModuleRef[],
        parentModule: ModuleRef
    ): Promise<HelpModule> {
        const helpModule = imports.find(m => m.constructorRef === HelpModule) as ModuleRef<HelpModule>;
        if (!helpModule) {
            if (parentModule) {
                return parentModule.resolveHelpModule(parentModule.imports, parentModule.parent);
            } else {
                return null;
            }
        } else {
            return helpModule.resolve();
        }
    }

    /**
     * Handles an errors thrown during module execution and calls the approach help implementations
     * when application
     * @param err Error that was through
     * @param helpModule Instance of the help module
     * @param route Current route at which the error was thrown
     */
    private async handleError(
        err: any,
        helpModule: HelpModule,
        route: RegisteredRoute
    ): Promise<void> {
        if (helpModule) {
            if (helpModule.isHelpError(err)) {
                return await helpModule.handleHelpError(this, route, err);
            }
        }
        throw err;
    }




}
