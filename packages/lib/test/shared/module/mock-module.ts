import { ModuleRef } from '../../../src/internal/module/module-ref';
import { ConfiguredModule, ModuleDefinition, CliModuleOpts } from '../../../src/internal/module/module-models';
import { MockProvider } from '../di/mock-provider';
import { ProviderRef } from '../../../src/internal/dependency-injection/provider-refs/provider-ref';
import { MockClassProvider } from '../di/class-providers';
import { MockValueProvider } from '../di/value-providers';
import { MockClass } from '../common/mock-class';
import { symbol2 } from '../common/utils';
import { MetadataKey } from '../../../src/internal/common/meta-data';
import { MockRoute } from './mock-route';
import { MockOptions } from '../options/options';
import { MockMappedOptions } from '../parser/mapped-options';
import { CommandRoute } from '../../../src';
import { RegisteredRoute } from '../../../src/internal/command/registered-route';
import { MockRegistery } from '../app/mock-registry';
import { OptionsProviderRef } from '../../../src/internal/options/option-provider-ref';
import { MockFactoryProvider } from '../di/factory-providers';
import { OptionsLink } from '../../../src/internal/options/options-link';
import { Type } from '../../../src/internal/common/cli-types';
import { ConstructorProviderRef } from '../../../src/internal/dependency-injection/provider-refs/constructor-provider-ref';
import { MockCommand } from '../commands/commands';
import { ValueProviderRef } from '../../../src/internal/dependency-injection/provider-refs/value-provider-ref';
import { CLI_VERSION, CLI_NAME } from '../../../src/internal/app/app-context';

export type MockExport = MockProvider | MockModule | MockRoute | MockOptions;

export class MockModule<T = any> extends MockClass<T> {

    static simpleModuleWithProviders() {
        return new MockModule()
            .addProvider(new MockClassProvider())
            .addProvider(new MockValueProvider(symbol2, [1, 2, 3]));
    }

    private _registry: MockRegistery;
    private _providers: MockProvider[] = [];
    private _providerRefs: ProviderRef[] = [];
    private _moduleRef: ModuleRef;
    private _appliedMetadata: boolean;
    private _options: MockOptions[] = [];
    private _routes: MockRoute[] = [];
    private _parent: MockModule;
    private _exports: MockExport[] = [];
    private _imports: MockModule[] = [];
    private _configuredImports: ConfiguredModule[] = [];
    private _configuredExports: ConfiguredModule[] = [];

    get mockRegistry() {
        return this._registry;
    }

    setRegistry(reg: MockRegistery) {
        this._registry = reg;
        return this;
    }

    constructor() {
        super();
        this._registry = new MockRegistery();
    }

    get moduleMetadata(): ModuleDefinition {
        return {
            providers: this._providers.map(p => p.provider),
            commands: this._routes.map(r => r.register().route),
            imports: [
                ...this._imports.map(imprt => imprt.applyMetadata().constructorRef),
                ...this._configuredImports
            ],
            exports: this.getExportsMetadata(),
            options: this._options.map(opt => opt.applyMetadata().constructorRef),
        };
    }

    addImport(mod: MockModule) {
        this._imports.push(mod);
        return this;
    }

    get mockRoutes() {
        return this._routes;
    }

    get moduleRef() {
        return this._moduleRef;
    }

    get routes(): CommandRoute[] {
        return this._routes.map(r => r.route);
    }

    get registeredRoutes(): RegisteredRoute[] {
        if (!this._appliedMetadata) {
            this.applyMetadata();
        }
        return this._routes.map(r => r.registeredRoute);
    }

    addOptions(options: MockOptions) {
        this._options.push(options);
        return this;
    }

    removeOptions(options: MockOptions) {
        const exisitng = this._options.find(o => o === o);
        if (exisitng) {
            this._options.splice(this._options.indexOf(options));
        }
        return this;
    }

    setParent(parent: MockModule) {
        this._parent = parent;
        return this;
    }

    addRoute(route: MockRoute) {
        this._routes.push(route);
        if(route.isCommand) {
            route.mockCommand.setParent(this);
        } else {
            route.mockModule.setParent(this);
        }
        return this;
    }

    modifyRoute(index: number, fn: (route: MockRoute) => MockRoute) {
        if (!!this._routes[index]) {
            this._routes[index] = fn(this._routes[index]);
        } else {
            throw new Error(`Cant modify route in mock module becuase index ${index} is not valid`);
        }
        return this;
    }

    removeRoute(index: number) {
        if (!!this._routes[index]) {
            this._routes.splice(index, 1);
        } else {
            throw new Error(`Cant remove route in mock module becuase index ${index} is not valid`);
        }
        return this;
    }

    addProvider(provider: MockProvider) {
        this._providers.push(provider);
        this._providerRefs.push(provider.providerRef());
        return this;
    }

    modifyProvider(index: number, fn: (provider: MockProvider) => MockProvider) {
        if (!!this._providers[index]) {
            this._providers[index] = fn(this._providers[index]);
            this._providerRefs[index] = this._providers[index].providerRef();
        } else {
            throw new Error(`Can't modify provider at index ${index} becuase it doesn't exist`);
        }
    }


    removeProvider(index: number) {
        if (index <= this._providers.length - 1) {
            this._providerRefs.splice(index, 1);
            if (this._moduleRef) {
                this._moduleRef.providers.slice(index, 1);
            }
        } else {
            throw new Error(`Can't remove provider at index ${index} becuase it doesn't exist`);
        }
        return this;
    }

    addExport(exprt: MockProvider | MockModule | MockRoute | MockOptions) {
        this._exports.push(exprt);
        return this;
    }

    addConfiguredExport(exprt: MockModule, configured: CliModuleOpts) {
        this._configuredExports.push({
            module: exprt.applyMetadata().constructorRef,
            ...configured
        });
        return this;
    }

    addConfiguredImport(exprt: MockModule, configured: CliModuleOpts) {
        this._configuredImports.push({
            module: exprt.applyMetadata().constructorRef,
            ...configured
        });
        return this;
    }

    private getExportsMetadata() {
        return [
            ...this._exports.map(exprt => {
                if (exprt instanceof MockClassProvider || exprt instanceof MockValueProvider || exprt instanceof MockFactoryProvider) {
                    return exprt.provider;
                } else if (exprt instanceof MockModule || exprt instanceof MockOptions) {
                    return (exprt as MockModule | MockOptions).applyMetadata().constructorRef;
                } else {
                    return (exprt as MockRoute).route;
                }
            }),
            ...this._configuredExports
        ];
    }

    applyMetadata() {
        super.applyMetadata();
        Reflect.defineMetadata(MetadataKey.Module, this.moduleMetadata, this.constructorRef);
        this._appliedMetadata = true;
        return this;
    }

    removeMetadata() {
        super.removeMetadata();
        Reflect.deleteMetadata(MetadataKey.Module, this.constructorRef);
        this._appliedMetadata = false;
        return this;
    }

    getOptions(index: number) {
        if (this._options[index]) {
            return this._options[0];
        } else {
            throw new Error(`MockCommand has no options at index ${index}`);
        }
    }

    mappedOptions() {
        const mappedOptions = new MockMappedOptions();
        this._options.forEach(o => {
            o.optionsMetadata.forEach(def => {
                mappedOptions.add(o.constructorRef, def);
            });
        });
        return mappedOptions.options;
    }

    getRegisteredRoutes() {
        return this._routes.map(r => {
            if (r.mockCommand) {
                r.mockCommand.setRegistry(this._registry);
                r.mockCommand.setParent(this);
            }
            if (r.mockModule) {
                r.mockModule.setRegistry(this._registry);
                r.mockModule.setParent(this);
            }
            r.register(this._moduleRef);
            return r.registeredRoute;
        });
    }

    getImports() {
        return [
            ...this._imports.map(m => m.createModuleRef().moduleRef),
            ...this._configuredImports.map(c => new ModuleRef(c.module, this._registry.registry, undefined, c))
        ];
    }

    getExportedRoutes(): RegisteredRoute[] {
        return this._exports
            .filter(r => r instanceof MockRoute)
            .map(r => r as MockRoute)
            .map(r => {
                if (r.mockCommand) {
                    r.mockCommand.setRegistry(this._registry);
                    r.mockCommand.setParent(this);
                }
                if (r.mockModule) {
                    r.mockModule.setRegistry(this._registry);
                    r.mockModule.setParent(this);
                }
                r.register(this._moduleRef);
                return r.registeredRoute;
            });
    }

    createModuleRef(
        configured?: ConfiguredModule
    ) {
        Reflect.defineMetadata(MetadataKey.Module, {
            providers: [],
            commands: [],
            imports: [],
            exports: [],
            options: [],
        }, this.constructorRef);

        this._moduleRef = new ModuleRef<T>(this.constructorRef, this._registry.registry, this._parent?.moduleRef, configured);

        this._routes.forEach(r => {
            if (r.mockCommand) {
                r.mockCommand.setParent(this);
            }
            if (r.mockModule) {
                r.mockModule.setParent(this);
            }
            r.register(this._moduleRef);
        });

        this._moduleRef.options = this._options.map(o => ({ constructorRef: o.applyMetadata().constructorRef, moduleRef: this.moduleRef, providerRef: new OptionsProviderRef(o.constructorRef, null, []) }));
        this._moduleRef.routes = this._routes.map(r => r.registeredRoute);

        this._moduleRef.providers = this._providerRefs;
        this._moduleRef.providerExports = this._exports
            .filter(p => p instanceof MockValueProvider || p instanceof MockClassProvider || p instanceof MockFactoryProvider)
            .map(p => (p as MockProvider).providerRef())
            .map(p => {
                if (p instanceof ConstructorProviderRef) {
                    p.parent = this.moduleRef;
                    p.globalProviders = this.moduleRef.globalProviders;
                }
                return p;
            });

        this._moduleRef.routeExports = this._exports
            .filter(r => r instanceof MockRoute)
            .map(r => { (r as MockRoute).register(); return (r as MockRoute).registeredRoute; });

        this._moduleRef.moduleExports = this._exports
            .filter(m => m instanceof MockModule)
            .map(m => (m as MockModule).createModuleRef().moduleRef);

        this._moduleRef.optionExports = this._exports
            .filter(o => o instanceof MockOptions)
            .map(o => ({ constructorRef: (o as MockModule).applyMetadata().constructorRef, moduleRef: this.moduleRef, providerRef: new OptionsProviderRef((o as MockModule).constructorRef, null, []) })) as OptionsLink[];

        [...this._moduleRef.routeExports, ...this._moduleRef.routes].forEach((r) => {
            if (r.isCommand) {
                r.command.options.forEach(o => o.providerRef = new OptionsProviderRef(o.constructorRef, null, []));
            }
        });


        return this;
    }

    createModuleRefWithMetadata(
        configured?: ConfiguredModule
    ) {
        this.applyMetadata();
        this._moduleRef = new ModuleRef<T>(this.constructorRef, this._registry.registry, this._parent?.moduleRef, configured);

        return this;
    }

    createModuleRefWithMockImports(
        configured?: ConfiguredModule
    ) {
        super.applyMetadata();
        Reflect.defineMetadata(MetadataKey.Module, { ...this.moduleMetadata }, this.constructorRef);
        this._appliedMetadata = true;
        this._registry.registry.registerSharedModule = (mod: Type<any> | ConfiguredModule) => {
            const imprt = this._imports.find(m => m.constructorRef === mod);
            return imprt.createModuleRef().moduleRef;
        };
        this._moduleRef = new ModuleRef<T>(this.constructorRef, this._registry.registry, this._parent?.moduleRef, configured);
    }

    configuredModule(opts: CliModuleOpts): ConfiguredModule {
        return {
            module: this.constructorRef,
            ...opts
        };
    }



}
