import { ValueProviderRef } from './../../src/internal/dependency-injection/provider-refs/value-provider-ref';
import {
    MockModuleBuilder, MockModule, MockClassProvider, MockValueProvider,
    symbol1, symbol2, MockFactoryProvider, MockRegistery, MockCommand, MockRoute, MockOptions, asyncThrowsError
} from '../shared';
import { MockProvider } from '../shared/di/mock-provider';
import { CliModuleOpts, Command, ParserModule, AppContext, HelpModule, BeforeExecute, CliModule, AfterExecute } from '../../src';
import { ModuleRef } from '../../src/internal/module/module-ref';
import { ConstructorProviderRef } from '../../src/internal/dependency-injection/provider-refs/constructor-provider-ref';
import { ProviderUtils } from '../../src/internal/dependency-injection/provider-utils';
import { RegisteredRoute } from '../../src/internal/command/registered-route';
import { Type } from '../../src/internal/common/cli-types';
import { Injector } from '../../src/internal/dependency-injection/injector';
import { OptionsProviderRef } from '../../src/internal/options/option-provider-ref';
import { EvaluatedArgumentsContext } from '../../src/internal/parser/arguments-context';


describe('ModuleRef[class]', () => {

    let registry: MockRegistery;
    let builder: MockModuleBuilder;

    beforeEach(() => {
        registry = new MockRegistery().addProvider(new MockClassProvider());
        builder = new MockModuleBuilder()
            .addModule(new MockModule().setRegistry(registry))
            .addModule(new MockModule().setRegistry(registry))
            .addModule(new MockModule().setRegistry(registry))
            .addModule(new MockModule().setRegistry(registry));
    });

    const importParserModule = (mod: ModuleRef) => {
        registry.registry.providers.push(new ValueProviderRef(AppContext, new AppContext('1', '2'), true));
        mod.imports.push(new ModuleRef(ParserModule, registry.registry, null));
    };

    describe('constructor()', () => {

        const moduleRefWithMockImports = (
            b: MockModuleBuilder,
            configured?: CliModuleOpts
        ) => b.from(b.getModule(0)
            .addImport(b.getModule(1))
            .addImport(b.getModule(2))
        ).buildWithMockImports(configured ? b.getModule(0).configuredModule(configured) : undefined).root().moduleRef;

        const createModuleRef = (
            b: MockModuleBuilder,
            configured?: CliModuleOpts
        ) => b.buildWithMockImports(configured ? b.getModule(0).configuredModule(configured) : undefined).root().moduleRef;

        describe('[configuring-providers]', () => {

            const createProviderRefs = (
                moduleRef: ModuleRef,
                ...mockProviders: MockProvider[]
            ) => mockProviders
                .map(p => p.providerRef())
                .map(ref => {
                    if (ref instanceof ConstructorProviderRef) {
                        ref.parent = moduleRef;
                        ref.globalProviders = moduleRef.globalProviders;
                    }
                    return ref;
                });

            let providers: MockProvider[];
            beforeEach(() => {
                providers = [
                    new MockClassProvider(),
                    new MockClassProvider(),
                    new MockValueProvider(symbol1, 100),
                    new MockValueProvider(symbol2, 200)
                ];
                providers = [
                    ...providers,
                    new MockValueProvider(providers[0].token, 300),
                    new MockClassProvider().updateToken(providers[1].token),
                    new MockValueProvider(symbol1, 900),
                    new MockFactoryProvider(symbol2, () => 400)
                ];
            });

            it('Should add the direct providers (using the ProviderUtils.toProviderRef factory), attaching the module as the parent injector for constructor providers', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[0])
                    .addProvider(providers[2])
                );
                const spy = spyOn(ProviderUtils, 'toProviderRef').and.callThrough();
                const moduleRef = moduleRefWithMockImports(builder);
                expect(spy.calls.argsFor(0)).toEqual([providers[0].provider, moduleRef, builder.getModule(0).mockRegistry.registry.providers]);
                expect(spy.calls.argsFor(1)).toEqual([providers[2].provider, moduleRef, builder.getModule(0).mockRegistry.registry.providers]);
                expect(moduleRef.providers).toEqual(createProviderRefs(moduleRef, providers[0], providers[2]));
            });

            it('Should include configured providers with direct providers (using ProviderUtils factory), attaching the module as the parent for constructor providers', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[0])
                );
                const spy = spyOn(ProviderUtils, 'toProviderRef').and.callThrough();
                const moduleRef = moduleRefWithMockImports(builder, { providers: [providers[1].provider, providers[3].provider] });
                expect(spy.calls.argsFor(0)).toEqual([providers[0].provider, moduleRef, builder.getModule(0).mockRegistry.registry.providers]);
                expect(spy.calls.argsFor(1)).toEqual([providers[1].provider, moduleRef, builder.getModule(0).mockRegistry.registry.providers]);
                expect(spy.calls.argsFor(2)).toEqual([providers[3].provider, moduleRef, builder.getModule(0).mockRegistry.registry.providers]);
                expect(moduleRef.providers).toEqual(createProviderRefs(moduleRef, providers[0], providers[1], providers[3]));
            });

            it('Should overwrite direct provider declarations with configured that share the same token', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[0])
                    .addProvider(providers[1])
                    .addProvider(providers[2])
                );
                const moduleRef = moduleRefWithMockImports(builder, { providers: [providers[4].provider, providers[6].provider] });
                expect(moduleRef.providers).toEqual(createProviderRefs(moduleRef, providers[1], providers[4], providers[6]));
            });

            it('Should throw an error if two provider declarations have the same token', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[0])
                    .addProvider(providers[0])
                );
                expect(() => moduleRefWithMockImports(builder)).toThrowError();
            });

            it('Should throw an error if two provider exports have the same token', () => {
                builder.call(b => b.getModule(0)
                    .addExport(providers[1])
                    .addExport(providers[1])
                );
                expect(() => moduleRefWithMockImports(builder)).toThrowError();
            });

            it('The providers should not be added to the local module scope when declared as global', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[1].setGlobal(true))
                    .addProvider(providers[0])
                    .addProvider(providers[2].setGlobal(true))
                    .addProvider(providers[3])
                );
                const moduleRef = moduleRefWithMockImports(builder);
                expect(moduleRef.providers).toEqual(createProviderRefs(moduleRef, providers[0], providers[3]));
            });

            it('Should include providers exported from other modules', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[1])
                ).call(b =>
                    b.getModule(1).addExport(providers[0])
                ).call(b =>
                    b.getModule(2).addExport(providers[2]).addExport(providers[3])
                );
                const moduleRef = moduleRefWithMockImports(builder);

                expect(moduleRef.providers).toEqual([
                    ...createProviderRefs(moduleRef, providers[1]),
                    ...createProviderRefs(builder.getModule(1).moduleRef, providers[0]),
                    ...createProviderRefs(builder.getModule(2).moduleRef, providers[2], providers[3])
                ]);
            });

            it('Should not include providers exported from other modules that already exist within the module', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[1])
                    .addProvider(providers[2])
                    .addProvider(providers[3])
                ).call(b =>
                    b.getModule(1).addExport(providers[4])
                ).call(b =>
                    b.getModule(2).addExport(providers[5]).addExport(providers[6])
                );
                const moduleRef = moduleRefWithMockImports(builder);

                expect(moduleRef.providers).toEqual([
                    ...createProviderRefs(moduleRef, providers[1], providers[2], providers[3]),
                    ...createProviderRefs(builder.getModule(1).moduleRef, providers[4]),
                ]);
            });

            it('Should register global provider declarations in the components registry', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[2].setGlobal(true))
                    .addProvider(providers[1])
                    .addProvider(providers[0].setGlobal(true))
                );
                const spy = registry.globalProvidersSpy()();
                const moduleRef = moduleRefWithMockImports(builder);
                expect(spy.calls.argsFor(0)).toEqual(createProviderRefs(moduleRef, providers[2]));
                expect(spy.calls.argsFor(1)).toEqual(createProviderRefs(moduleRef, providers[0]));
            });

            it('Should register global provider exports that don\'t exist in the provider declarations', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[1])
                    .addProvider(providers[0])
                    .addExport(providers[4].setGlobal(true))
                    .addExport(providers[6].setGlobal(true))
                    .addExport(providers[5])
                );
                const spy = registry.globalProvidersSpy()();
                const moduleRef = moduleRefWithMockImports(builder);
                expect(spy).toHaveBeenCalledTimes(1);
                expect(spy.calls.argsFor(0)).toEqual(createProviderRefs(moduleRef, providers[6]));
            });

            it('Should set the provider exports to exported providers not declared as global', () => {
                builder.call(b => b.getModule(0)
                    .addExport(providers[1])
                    .addExport(providers[0].setGlobal(true))
                    .addExport(providers[2])
                );
                const moduleRef = moduleRefWithMockImports(builder);
                expect(moduleRef.providerExports).toEqual(createProviderRefs(moduleRef, providers[1], providers[2]));
            });

            it('Should export the declared provider if the same provider is declared and exported', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[0])
                    .addProvider(providers[1])
                    .addExport(providers[0])
                    .addExport(providers[2])
                    .addExport(providers[3])
                ).call(b => b.getModule(1).addExport(providers[6]));
                const moduleRef = moduleRefWithMockImports(builder);
                expect(moduleRef.providerExports[0]).toBe(moduleRef.providers[0]);
                expect(moduleRef.providerExports[1]).toBe(moduleRef.providers[2]);
                expect(moduleRef.providerExports[2]).toEqual(createProviderRefs(builder.getModule(0).moduleRef, providers[3])[0]);
            });

            it('Should throw an error if it imports two or more modules that export the same provider', () => {
                builder.call(b => b.getModule(0)
                    .addProvider(providers[1])
                ).call(b => b.getModule(1).addExport(providers[0]))
                    .call(b => b.getModule(2).addExport(providers[0]));
                expect(() => moduleRefWithMockImports(builder)).toThrowError();
            });

            it('Should include provider exports from the configured module', () => {
                builder.getModule(0)
                    .addExport(builder.getModule(1).applyMetadata())
                    .addExport(new MockRoute().fromCommand(new MockCommand('asd').applyMetadata()))
                    .addExport(new MockOptions().applyMetadata())
                    .addExport(providers[0]);

                const moduleRef = moduleRefWithMockImports(builder, { exports: [providers[1].provider, providers[3].provider] });
                expect(moduleRef.providerExports).toEqual(createProviderRefs(moduleRef, providers[0], providers[1], providers[3]));
            });

            it('Should overwrite provider exports with exports specified in the configured module', () => {
                builder.getModule(0)
                    .addExport(builder.getModule(1).applyMetadata())
                    .addExport(new MockRoute().fromCommand(new MockCommand('asd').applyMetadata()))
                    .addExport(new MockOptions().applyMetadata())
                    .addExport(providers[0])
                    .addExport(providers[1])
                    .addExport(providers[2]);

                const moduleRef = moduleRefWithMockImports(builder, { exports: [providers[5].provider, providers[6].provider] });
                expect(moduleRef.providerExports).toEqual(createProviderRefs(moduleRef, providers[0], providers[5], providers[6]));
            });


        });

        describe('[configuring-routes]', () => {

            let commands: MockCommand<Command>[];
            beforeEach(() => {
                commands = [
                    new MockCommand('cmd1'),
                    new MockCommand('cmd2'),
                    new MockCommand('cmd3'),
                    new MockCommand('cmd4')
                ];
            });

            const moduleWithImportedRoutes = (exportedCommand: MockCommand<Command>) => {
                return builder.from(builder.getModule(0))
                    .addRoute(commands[0])
                    .call(b => b.getModule(0).addImport(
                        b.getModule(1).addExport(new MockRoute().fromCommand(exportedCommand)))
                    )
                    .call(b => b.getModule(0).addImport(
                        b.getModule(2).addExport(new MockRoute().fromModule(b.getModule(3)).updateOpts({ path: '77' })))
                    );

            };

            const moduleWithRoutes = () => {
                return builder.from(builder.getModule(0))
                    .addRoute(commands[0])
                    .addRoute(commands[1])
                    .addRoute(builder.getModule(1))
                    .addRoute(builder.getModule(2))
                    .call(b => b.routeFor(b.getModule(1)).updateOpts({ path: '1' }))
                    .call(b => b.routeFor(b.getModule(2)).updateOpts({ path: '2' }));

            };

            const sortRoutes = (routes: RegisteredRoute[]) => routes.sort((a, b) => a.path > b.path ? -1 : 1);



            it('Should create new routes (RouteUtils.fromCommand factory) for all direct declarations whether commands or module routes, registering the command and or modules with the global registry', () => {
                moduleWithRoutes();
                const registeredCommand = commands[0].commandRef();
                const registeredModule = builder.getModule(0).createModuleRef().moduleRef;
                const spy = spyOn(RegisteredRoute, 'fromCommandRoute').and.callThrough();
                const commandRegSpy = spyOn(registry.registry, 'registerCommand').and.returnValue(registeredCommand);
                const moduleRegSpy = spyOn(registry.registry, 'registerCommandModule').and.returnValue(registeredModule);
                const moduleRef = createModuleRef(builder);
                expect(commandRegSpy).toHaveBeenCalledTimes(2);
                expect(commandRegSpy.calls.argsFor(0)).toEqual([commands[0].constructorRef, moduleRef]);
                expect(commandRegSpy.calls.argsFor(1)).toEqual([commands[1].constructorRef, moduleRef]);
                expect(moduleRegSpy).toHaveBeenCalledTimes(2);
                expect(moduleRegSpy.calls.argsFor(0)).toEqual([builder.getModule(1).constructorRef, moduleRef]);
                expect(moduleRegSpy.calls.argsFor(1)).toEqual([builder.getModule(2).constructorRef, moduleRef]);
                expect(spy).toHaveBeenCalledTimes(4);
                expect(spy.calls.argsFor(0)).toEqual([builder.routeFor(commands[0]).route, registeredCommand]);
                expect(spy.calls.argsFor(1)).toEqual([builder.routeFor(commands[1]).route, registeredCommand]);
                expect(spy.calls.argsFor(2)).toEqual([builder.routeFor(builder.getModule(1)).route, registeredModule]);
                expect(spy.calls.argsFor(3)).toEqual([builder.routeFor(builder.getModule(2)).route, registeredModule]);
            });

            it('Should create routes from all direct declarations', () => {
                const moduleRef = createModuleRef(moduleWithRoutes());
                expect(moduleRef.routes).toEqual(builder.getModule(0).getRegisteredRoutes());
            });

            it('Should include routes from configured modules', () => {
                const configuredCommands = [new MockRoute().fromCommand(commands[2].applyMetadata()), new MockRoute().fromCommand(commands[3].applyMetadata())];
                const moduleRef = createModuleRef(moduleWithRoutes(), { commands: configuredCommands.map(c => c.route), });
                expect(sortRoutes(moduleRef.routes)).toEqual(sortRoutes([
                    ...builder.getModule(0).getRegisteredRoutes(),
                    ...configuredCommands.map(r => { r.register(moduleRef); return r.registeredRoute; })
                ]));
            });

            it('Should overwite direct route declarations with configured routes that have the same module or command', () => {
                const configuredCommands = [
                    new MockRoute().fromCommand(commands[1].applyMetadata()).updateOpts({ path: 'h' }),
                    new MockRoute().fromModule(builder.getModule(2)).updateOpts({ alias: 'g', path: 'x' })
                ];
                const moduleRef = createModuleRef(moduleWithRoutes(), { commands: configuredCommands.map(c => c.route), });
                expect(sortRoutes(moduleRef.routes)).toEqual(sortRoutes([
                    ...builder.getModule(0).getRegisteredRoutes().filter(r =>
                        (r.module && r.module.constructorRef !== builder.getModule(2).constructorRef) ||
                        (r.command && r.command.constructorRef !== commands[1].constructorRef)
                    ),
                    ...configuredCommands.map(r => { r.register(moduleRef); return r.registeredRoute; })
                ]));
            });

            it('Should include routes exported from other modules, creating them with the RegisteredRoute.fromRegisteredRoute factory', () => {
                const spy = spyOn(RegisteredRoute, 'fromRegisteredRoute').and.callThrough().and.callFake((r, m) => new RegisteredRoute(r, m));
                const moduleRef = createModuleRef(moduleWithImportedRoutes(commands[1]));
                expect(spy).toHaveBeenCalledTimes(2);
                expect(spy.calls.argsFor(0)).toEqual([builder.getModule(1).moduleRef.routeExports[0], moduleRef]);
                expect(spy.calls.argsFor(1)).toEqual([builder.getModule(2).moduleRef.routeExports[0], moduleRef]);
                expect(sortRoutes(moduleRef.routes)).toEqual(sortRoutes([
                    ...builder.getModule(0).getRegisteredRoutes(),
                    new RegisteredRoute(builder.getModule(1).moduleRef.routeExports[0], moduleRef),
                    new RegisteredRoute(builder.getModule(2).moduleRef.routeExports[0], moduleRef)
                ]));
            });

            it('Should register all exported commands not declared within the commands with the global registry', () => {
                const commandRegSpy = spyOn(registry.registry, 'registerCommand').and.callThrough();
                const moduleRegSpy = spyOn(registry.registry, 'registerCommandModule').and.callThrough();
                moduleWithRoutes()
                    .removeRoute(commands[1])
                    .removeRoute(builder.getModule(1))
                    .getModule(0)
                    .addExport(new MockRoute().fromCommand(commands[0].applyMetadata()))
                    .addExport(new MockRoute().fromCommand(commands[3].applyMetadata()))
                    .addExport(new MockRoute().fromModule(builder.getModule(3).applyMetadata()).updateOpts({ path: 'h' }));
                const moduleRef = createModuleRef(builder);
                expect(commandRegSpy).toHaveBeenCalledTimes(2);
                expect(commandRegSpy.calls.argsFor(0)).toEqual([commands[0].constructorRef, moduleRef]);
                expect(commandRegSpy.calls.argsFor(1)).toEqual([commands[3].constructorRef, moduleRef]);
                expect(moduleRegSpy).toHaveBeenCalledTimes(2);
                expect(moduleRegSpy.calls.argsFor(0)).toEqual([builder.getModule(2).constructorRef, moduleRef]);
                expect(moduleRegSpy.calls.argsFor(1)).toEqual([builder.getModule(3).constructorRef, moduleRef]);
            });

            it('Should set the route exports using declared routes where the same route is also exported', () => {
                moduleWithRoutes()
                    .removeRoute(commands[1])
                    .removeRoute(builder.getModule(1))
                    .getModule(0)
                    .addExport(new MockRoute().fromCommand(commands[0].applyMetadata()))
                    .addExport(new MockRoute().fromCommand(commands[3].applyMetadata()))
                    .addExport(new MockRoute().fromModule(builder.getModule(3).applyMetadata()).updateOpts({ path: 'h' }));
                const moduleRef = createModuleRef(builder);
                expect(moduleRef.routeExports.indexOf(moduleRef.routes[0])).not.toBe(-1);
                expect(sortRoutes(moduleRef.routeExports)).toEqual(sortRoutes([
                    moduleRef.routes[0],
                    ...builder.getModule(0).getExportedRoutes().filter(exp => !exp.command || (exp.command && exp.command.constructorRef !== commands[0].constructorRef))
                ]));
            });

            it('Should throw an error if two declared routes have the same name/path', () => {
                builder.from(builder.getModule(0)).getModule(0)
                    .addRoute(new MockRoute().fromCommand(commands[0].applyMetadata()).updateOpts({ path: 'z' }))
                    .addRoute(new MockRoute().fromCommand(commands[1].applyMetadata()).updateOpts({ path: 'z' }));
            });

            it('Should throw an error if two declared routes have the same alias', () => {
                builder.from(builder.getModule(0)).getModule(0)
                    .addRoute(new MockRoute().fromCommand(commands[0].applyMetadata()).updateOpts({ alias: 'a' }))
                    .addRoute(new MockRoute().fromCommand(commands[1].applyMetadata()).updateOpts({ alias: 'a' }));
                expect(() => createModuleRef(builder)).toThrowError();
            });

            it('Should throw an error if two exported routes have the same name/path', () => {
                builder.from(builder.getModule(0)).getModule(0)
                    .addExport(new MockRoute().fromCommand(commands[0].applyMetadata()).updateOpts({ path: 'f' }))
                    .addExport(new MockRoute().fromCommand(commands[1].applyMetadata()).updateOpts({ path: 'f' }));
                expect(() => createModuleRef(builder)).toThrowError();
            });

            it('Should throw an error if two exported routes have the same alias', () => {
                builder.from(builder.getModule(0)).getModule(0)
                    .addExport(new MockRoute().fromCommand(commands[0].applyMetadata()).updateOpts({ alias: 'a' }))
                    .addExport(new MockRoute().fromCommand(commands[1].applyMetadata()).updateOpts({ alias: 'a' }));
                expect(() => createModuleRef(builder)).toThrowError();
            });

            it('Should include route exports from the configured module', () => {
                builder.from(builder.getModule(0)).getModule(0)
                    .addExport(new MockRoute().fromCommand(commands[0].applyMetadata()).updateOpts({ path: 'f' }))
                    .addExport(new MockClassProvider())
                    .addExport(new MockOptions());
                const moduleRef = createModuleRef(builder, {
                    exports: [
                        new MockRoute().fromCommand(commands[2].applyMetadata()).route,
                        new MockRoute().fromModule(builder.getModule(1).applyMetadata()).updateOpts({ path: 'p' }).route
                    ]
                });
                expect(moduleRef.routeExports).toEqual([
                    ...builder.getModule(0).getExportedRoutes(),
                    new MockRoute().fromCommand(commands[2].applyMetadata()).register(moduleRef).registeredRoute,
                    new MockRoute().fromModule(builder.getModule(1).applyMetadata()).updateOpts({ path: 'p' }).register(moduleRef).registeredRoute
                ]);
            });

            it('Should overwrite route export declarations with those provided in the configured module', () => {
                builder.from(builder.getModule(0)).getModule(0)
                    .addExport(new MockRoute().fromCommand(commands[0].applyMetadata()).updateOpts({ path: 'f' }))
                    .addExport(new MockRoute().fromModule(builder.getModule(1).applyMetadata()).updateOpts({ path: 'p' }));
                const moduleRef = createModuleRef(builder, {
                    exports: [
                        new MockRoute().fromCommand(commands[0].applyMetadata()).updateOpts({ path: 'z' }).route,
                        new MockRoute().fromModule(builder.getModule(1).applyMetadata()).updateOpts({ path: 'h' }).route
                    ]
                });
                expect(moduleRef.routeExports).toEqual([
                    new MockRoute().fromCommand(commands[0].applyMetadata()).updateOpts({ path: 'z' }).register(moduleRef).registeredRoute,
                    new MockRoute().fromModule(builder.getModule(1).applyMetadata()).updateOpts({ path: 'h' }).register(moduleRef).registeredRoute,
                ]);
            });

        });

        describe('[configuring-options]', () => {

            let options: MockOptions[];

            beforeEach(() => {
                options = [
                    new MockOptions(),
                    new MockOptions(),
                    new MockOptions(),
                    new MockOptions()
                ];
                builder.from(builder.getModule(0));
            });
            const createLink = (c: Type<any>, modRef?: ModuleRef) => ({ constructorRef: c, moduleRef: modRef || null, providerRef: null });

            it('Should throw an error if any options are undecorated', () => {
                builder.getModule(0)
                    .addOptions(options[0])
                    .addOptions(options[1])
                    .applyMetadata();
                options[0].removeMetadata();
                expect(() => new ModuleRef(builder.getModule(0).constructorRef, registry.registry, null)).toThrowError();
            });

            it('Should throw an error if two of the same options are declared', () => {
                builder.getModule(0)
                    .addOptions(options[0])
                    .addOptions(options[0]);
                expect(() => createModuleRef(builder)).toThrowError();
            });

            it('Should throw an error if two of the same options are declared', () => {
                builder.getModule(0)
                    .addExport(options[0])
                    .addExport(options[0]);
                expect(() => createModuleRef(builder)).toThrowError();
            });

            it('Should register declarations with the global registry and add them to the module imports', () => {
                const spy = spyOn(registry.registry, 'registerOptions').and.callFake((c) => createLink(c));
                builder.getModule(0)
                    .addOptions(options[0])
                    .addOptions(options[1]);
                const moduleRef = createModuleRef(builder);
                expect(spy).toHaveBeenCalledTimes(2);
                expect(spy.calls.argsFor(0)).toEqual([options[0].constructorRef, moduleRef]);
                expect(spy.calls.argsFor(1)).toEqual([options[1].constructorRef, moduleRef]);
                expect(moduleRef.options).toEqual([createLink(options[0].constructorRef), createLink(options[1].constructorRef)]);
            });

            it('Should include configured options with the options', () => {
                spyOn(registry.registry, 'registerOptions').and.callFake((c) => createLink(c));
                builder.getModule(0)
                    .addOptions(options[0]);
                const moduleRef = createModuleRef(builder, { options: [options[2].applyMetadata().constructorRef, options[3].applyMetadata().constructorRef] });
                expect(moduleRef.options).toEqual([
                    createLink(options[0].constructorRef),
                    createLink(options[2].constructorRef),
                    createLink(options[3].constructorRef)
                ]);
            });

            it('Should not include duplicates where the same module as been imported and exported', () => {
                spyOn(registry.registry, 'registerOptions').and.callFake((c) => createLink(c));
                builder.getModule(0)
                    .addOptions(options[0]);
                const moduleRef = createModuleRef(builder, { options: [options[1].applyMetadata().constructorRef, options[0].applyMetadata().constructorRef] });
                expect(moduleRef.options).toEqual([
                    createLink(options[1].constructorRef),
                    createLink(options[0].constructorRef)
                ]);
            });

            it('Should set the exported options and declare exported options in the global registry where not declared in the options metadata', () => {
                const spy = spyOn(registry.registry, 'registerOptions').and.callFake((c) => createLink(c));
                builder.getModule(0)
                    .addOptions(options[0])
                    .addOptions(options[2])
                    .addExport(options[0].applyMetadata())
                    .addExport(options[1].applyMetadata());
                const moduleRef = createModuleRef(builder);
                expect(spy).toHaveBeenCalledTimes(3);
                expect(spy.calls.argsFor(0)).toEqual([options[0].constructorRef, moduleRef]);
                expect(spy.calls.argsFor(1)).toEqual([options[2].constructorRef, moduleRef]);
                expect(spy.calls.argsFor(2)).toEqual([options[1].constructorRef, moduleRef]);
                expect(moduleRef.optionExports).toEqual([
                    createLink(options[0].constructorRef),
                    createLink(options[1].constructorRef)
                ]);
            });

            it('Should include options exports from the configured module', () => {
                const spy = spyOn(registry.registry, 'registerOptions').and.callFake((c) => createLink(c));
                builder.getModule(0)
                    .addExport(new MockRoute().fromCommand(new MockCommand('asda')))
                    .addExport(options[1])
                    .addExport(new MockClassProvider());
                const moduleRef = createModuleRef(builder, { exports: [options[2].applyMetadata().constructorRef, options[0].applyMetadata().constructorRef] });
                expect(moduleRef.optionExports).toEqual([
                    createLink(options[1].constructorRef),
                    createLink(options[2].constructorRef),
                    createLink(options[0].constructorRef)
                ]);
            });

            it('Should not duplicate declared option exports that also exist in the configured module', () => {
                const spy = spyOn(registry.registry, 'registerOptions').and.callFake((c) => createLink(c));
                builder.getModule(0)
                    .addExport(new MockRoute().fromCommand(new MockCommand('asda')))
                    .addExport(options[1])
                    .addExport(options[0])
                    .addExport(new MockClassProvider());
                const moduleRef = createModuleRef(builder, { exports: [options[0].applyMetadata().constructorRef, options[2].applyMetadata().constructorRef] });
                expect(moduleRef.optionExports).toEqual([
                    createLink(options[1].constructorRef),
                    createLink(options[0].constructorRef),
                    createLink(options[2].constructorRef)
                ]);
            });

        });

        describe('[configuring-imports]', () => {

            let modules: MockModule[] = [];
            beforeEach(() => {
                builder.from(builder.getModule(0));
                modules = [
                    new MockModule().applyMetadata(),
                    new MockModule().applyMetadata(),
                    new MockModule().applyMetadata(),
                    new MockModule().applyMetadata(),
                ];
            });

            const sharedModule = (
                mod: MockModule,
                configured?: CliModuleOpts
            ) => new ModuleRef(mod.applyMetadata().constructorRef, registry.registry, undefined, configured ? { module: mod.constructorRef, ...configured } : undefined);

            const createModuleRefWithImports = (
                configured?: CliModuleOpts
            ) => builder.root().createModuleRefWithMetadata(configured ? builder.root().configuredModule(configured) : undefined).moduleRef;

            it('Should throw an error if the same module is imported more than once', () => {
                builder.getModule(0)
                    .addImport(builder.getModule(1))
                    .addConfiguredImport(builder.getModule(1), {});
                expect(() => createModuleRefWithImports()).toThrowError();
            });

            it('Should throw an error if the same module is imported more than once', () => {
                builder.getModule(0)
                    .addExport(builder.getModule(2))
                    .addConfiguredExport(builder.getModule(2), {});
                expect(() => createModuleRefWithImports()).toThrowError();
            });

            it('Should throw an error if an undecorated module is provided', () => {
                builder.getModule(0)
                    .addConfiguredExport(builder.getModule(2), {});
                builder.getModule(2).removeMetadata();
                expect(() => createModuleRefWithImports()).toThrowError();
            });

            it('Should register all shared modules with the global registry', () => {
                builder.getModule(0)
                    .addImport(builder.getModule(1))
                    .addImport(builder.getModule(2));
                const spy = spyOn(registry.registry, 'registerSharedModule').and.callThrough();
                const moduleRef = createModuleRefWithImports();
                expect(spy).toHaveBeenCalledTimes(2);
                expect(spy.calls.argsFor(0)).toEqual([builder.getModule(1).constructorRef]);
                expect(spy.calls.argsFor(1)).toEqual([builder.getModule(2).constructorRef]);
                expect(moduleRef.imports).toEqual(builder.getModule(0).getImports());
            });

            it('Should register and include imports from the configured module', () => {
                builder.getModule(0)
                    .addImport(builder.getModule(3));
                const spy = spyOn(registry.registry, 'registerSharedModule').and.callThrough();
                const moduleRef = createModuleRefWithImports({ imports: [builder.getModule(2).applyMetadata().constructorRef, builder.getModule(1).applyMetadata().constructorRef] });
                expect(spy).toHaveBeenCalledTimes(3);
                expect(spy.calls.argsFor(0)).toEqual([builder.getModule(3).constructorRef]);
                expect(spy.calls.argsFor(1)).toEqual([builder.getModule(2).constructorRef]);
                expect(spy.calls.argsFor(2)).toEqual([builder.getModule(1).constructorRef]);
                expect(moduleRef.imports).toEqual([
                    sharedModule(builder.getModule(3)),
                    sharedModule(builder.getModule(2)),
                    sharedModule(builder.getModule(1))
                ]);
            });

            it('Should overwrite declared imports with configured that share the same constructor', () => {
                builder.getModule(0)
                    .addImport(builder.getModule(1))
                    .addImport(builder.getModule(3));
                const spy = spyOn(registry.registry, 'registerSharedModule').and.callThrough();
                const provider = new MockClassProvider();
                const moduleRef = createModuleRefWithImports({ imports: [builder.getModule(2).applyMetadata().constructorRef, builder.getModule(1).applyMetadata().configuredModule({ providers: [provider.provider] })] });
                expect(spy).toHaveBeenCalledTimes(3);
                expect(spy.calls.argsFor(0)).toEqual([builder.getModule(3).constructorRef]);
                expect(spy.calls.argsFor(1)).toEqual([builder.getModule(2).constructorRef]);
                expect(spy.calls.argsFor(2)).toEqual([builder.getModule(1).applyMetadata().configuredModule({ providers: [provider.provider] })]);
                expect(moduleRef.imports).toEqual([
                    sharedModule(builder.getModule(3)),
                    sharedModule(builder.getModule(2)),
                    sharedModule(builder.getModule(1), { providers: [provider.provider] })
                ]);
            });

            it('Should include all exported modules from other imported modules', () => {
                builder.getModule(0)
                    .addImport(builder.getModule(1).addExport(modules[3]))
                    .addImport(builder.getModule(3).addExport(modules[0]).addExport(modules[1]));
                const moduleRef = createModuleRefWithImports();
                expect(moduleRef.imports).toEqual([
                    sharedModule(builder.getModule(1)),
                    sharedModule(builder.getModule(3)),
                    sharedModule(modules[3]),
                    sharedModule(modules[0]),
                    sharedModule(modules[1])
                ]);
            });

            it('Should not include indirect imports that have already been imported directly', () => {
                const provider = new MockClassProvider();
                builder.getModule(0)
                    .addConfiguredImport(modules[0], { providers: [provider.provider] })
                    .addImport(builder.getModule(1).addExport(modules[0]))
                    .addImport(builder.getModule(3));
                const moduleRef = createModuleRefWithImports();
                expect(moduleRef.imports).toEqual([
                    sharedModule(builder.getModule(1)),
                    sharedModule(builder.getModule(3)),
                    sharedModule(modules[0], { providers: [provider.provider] }),
                ]);
            });

            it('Should set the provider exports, using direct declarations where also exported else registering the new exports with the global registry', () => {
                const provider = new MockClassProvider();
                const spy = spyOn(registry.registry, 'registerSharedModule').and.callThrough();
                builder.getModule(0)
                    .addConfiguredImport(modules[1], { providers: [provider.provider] })
                    .addExport(builder.getModule(1))
                    .addExport(modules[1]);
                const moduleRef = createModuleRefWithImports();
                expect(spy).toHaveBeenCalledTimes(2);
                expect(spy.calls.argsFor(0)).toEqual([modules[1].configuredModule({ providers: [provider.provider] })]);
                expect(spy.calls.argsFor(1)).toEqual([builder.getModule(1).constructorRef]);
                expect(moduleRef.moduleExports).toEqual([
                    sharedModule(modules[1], { providers: [provider.provider] }),
                    sharedModule(builder.getModule(1))
                ]);
            });

            it('Should include module exports from the configured module', () => {
                builder.getModule(0)
                    .addExport(new MockRoute().fromCommand(new MockCommand('asda')))
                    .addExport(new MockOptions())
                    .addExport(new MockClassProvider())
                    .addExport(modules[1].applyMetadata());
                const moduleRef = createModuleRefWithImports({ exports: [modules[3].applyMetadata().constructorRef, modules[2].applyMetadata().constructorRef] });
                expect(moduleRef.moduleExports).toEqual([
                    sharedModule(modules[1]),
                    sharedModule(modules[3]),
                    sharedModule(modules[2])
                ]);
            });

            it('Should overwrite declared module exports with exports form the configured module', () => {
                const provider = new MockClassProvider();
                builder.getModule(0)
                    .addConfiguredExport(modules[1].applyMetadata(), { providers: [provider.provider] });
                const moduleRef = createModuleRefWithImports({ exports: [modules[1].applyMetadata().constructorRef, modules[2].applyMetadata().constructorRef] });
                expect(moduleRef.moduleExports).toEqual([
                    sharedModule(modules[1]),
                    sharedModule(modules[2])
                ]);
            });


        });


    });

    describe('resolve()', () => {

        it('Should use the super injector to resolve and instance of the module when called for the first time', async () => {
            const moduleRef = builder.getModule(0).createModuleRef().moduleRef;
            const instance = builder.getModule(0).createInstance();
            const spy = spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            const result = await moduleRef.resolve();
            expect(spy).toHaveBeenCalled();
            expect(result).toBe(instance);
        });

        it('Should not create a new instance when called for the second time', async () => {
            const moduleRef = builder.getModule(0).createModuleRef().moduleRef;
            const spy = spyOn(Injector.prototype, 'resolve').and.resolveTo(builder.getModule(0).createInstance());
            const result = await moduleRef.resolve();
            const result1 = await moduleRef.resolve();
            expect(spy).toHaveBeenCalledTimes(1);
            expect(result).toBe(result1);
        });

        it('It should add the option providers to the modules options scope when called for the first time', async () => {
            const moduleRef = builder.getModule(0)
                .addOptions(new MockOptions())
                .addOptions(new MockOptions())
                .createModuleRef().moduleRef;
            moduleRef.options.forEach(o => o.providerRef = new OptionsProviderRef(o.constructorRef, moduleRef, []));
            const providers = [new MockClassProvider().providerRef()];
            moduleRef.providers = providers;
            await moduleRef.resolve();
            expect(moduleRef.providers).toEqual([...providers, ...moduleRef.options.map(o => o.providerRef)]);
        });

        it('It should add the option providers again once called for the second time', async () => {
            const moduleRef = builder.getModule(0)
                .addOptions(new MockOptions())
                .addOptions(new MockOptions())
                .createModuleRef().moduleRef;
            moduleRef.options.forEach(o => o.providerRef = new OptionsProviderRef(o.constructorRef, moduleRef, []));
            moduleRef.providers = [new MockClassProvider().providerRef()];
            await moduleRef.resolve();
            const providers = [...moduleRef.providers];
            await moduleRef.resolve();
            expect(moduleRef.providers).toEqual(providers);
        });

    });

    describe('validate()', () => {

        let moduleRef: ModuleRef;
        beforeEach(() => {
            moduleRef = builder.from(builder.getModule(0))
                .addRoute(builder.getModule(1))
                .root()
                .setRegistry(new MockRegistery())
                .createModuleRef()
                .moduleRef;
        });

        it('Should throw an error if the parser module has not been imported into the root', async () => {
            expect(await asyncThrowsError(async () => await moduleRef.validate())).toBe(true);
            expect(await asyncThrowsError(async () => await moduleRef.routes[0].module.validate())).toBe(true);
        });

        it('Should throw an error if the parser module has been supplied in a module other that the root', async () => {
            importParserModule(moduleRef);
            importParserModule(moduleRef.routes[0].module);
            expect(await asyncThrowsError(async () => await moduleRef.routes[0].module.validate())).toBe(true);
        });

        it('Should call the parser modules validate function with itself', async () => {
            importParserModule(moduleRef);
            const spy = spyOn(ParserModule.prototype, 'validate');
            await moduleRef.validate();
            expect(spy).toHaveBeenCalledWith(moduleRef);
        });

    });

    describe('execute()', () => {
        let moduleRef: ModuleRef;
        let ctx: EvaluatedArgumentsContext;
        let commandRoute: RegisteredRoute;
        let subModule: ModuleRef;
        let hookCalls: string[];
        let callOrder: number[];
        const cmd = new MockCommand('cmd').addFunction('execute', () => { })

        beforeEach(() => {
            hookCalls = [];
            callOrder = [];
            moduleRef = builder.from(builder.getModule(0))
                .addRoute(builder.getModule(2))
                .addRouteAndSelect(builder.getModule(1))
                .addRoute(cmd)
                .call(() => builder.getModule(0).mockRoutes[0].updateOpts({ path: 'p' }))
                .call(() => builder.getModule(0).mockRoutes[1].updateOpts({ path: 'p2' }))
                .root()
                .createModuleRef()
                .moduleRef;

            ctx = { options: [], possibleParameters: [], possibleCommands: [], route: undefined }
            subModule = moduleRef.routes[1].module;
            commandRoute = subModule.routes[0];

        });

        const createModule = (cls: Type<any>) => {
            const ref = new ModuleRef(cls, registry.registry, null);
            spyOn(ref, 'resolve').and.resolveTo(new cls());
            return ref;
        };

        class OtherCommand implements Command { execute() { } }

        @CliModule({})
        class Mod1 {

            @BeforeExecute([OtherCommand])
            hook1() { hookCalls.push('mod1-hook1'); }

            @BeforeExecute()
            hook2() { hookCalls.push('mod1-hook2'); callOrder.push(4); }

            @AfterExecute([cmd.constructorRef])
            hook3() { hookCalls.push('mod1-hook3'); callOrder.push(6); }
        }

        @CliModule({})
        class Mod2 {

            @BeforeExecute([cmd.constructorRef])
            hook1() { hookCalls.push('mod2-hook1'); }

            @AfterExecute([OtherCommand])
            hook2() { hookCalls.push('mod2-hook2'); }

            @AfterExecute([])
            hook3() { hookCalls.push('mod2-hook3'); }
        }

        const importHelpModule = (mod: ModuleRef) => {
            mod.imports.push(new ModuleRef(HelpModule, registry.registry, null));
        };

        it('Should throw an error if the parser module has not been imported into the root', async () => {
            expect(await asyncThrowsError(async () => await moduleRef.validate())).toBe(true);
            expect(await asyncThrowsError(async () => await moduleRef.routes[0].module.validate())).toBe(true);
        });

        it('Should throw an error if the parser module has been supplied in a module other that the root', async () => {
            importParserModule(moduleRef);
            importParserModule(moduleRef.routes[0].module);
            expect(await asyncThrowsError(async () => await moduleRef.routes[0].module.validate())).toBe(true);
        });

        it('Should call the execute on a child module root if the parser module resolved the route to a sub command module', async () => {
            importParserModule(moduleRef);
            const spy = spyOn(ParserModule.prototype, 'evalauteContext').and.returnValue({ ...ctx, route: moduleRef.routes[0] });
            const executeSpy = spyOn(moduleRef.routes[0].module, 'execute');
            await moduleRef.execute(['1', '2']);
            expect(spy).toHaveBeenCalledWith(['1', '2'], moduleRef.routes);
            expect(executeSpy).toHaveBeenCalled();
        });

        it('Should call the help modules handle error function if a help module is imported into the module and the error is a help error', async () => {
            importParserModule(moduleRef);
            importHelpModule(moduleRef);
            spyOn(ParserModule.prototype, 'evalauteContext').and.returnValue({ ...ctx, route: null });
            spyOn(HelpModule.prototype, 'isHelpError').and.returnValue(true);
            const spy = spyOn(HelpModule.prototype, 'handleHelpError');
            await moduleRef.execute(['1', '2']);
            expect(spy).toHaveBeenCalled();
        });

        it('Should not call the help modules handle error function if the error is not a help error', async () => {
            importParserModule(moduleRef);
            importHelpModule(moduleRef);
            spyOn(ParserModule.prototype, 'evalauteContext').and.returnValue({ ...ctx, route: null });
            spyOn(HelpModule.prototype, 'isHelpError').and.returnValue(false);
            const spy = spyOn(HelpModule.prototype, 'handleHelpError');
            expect(await asyncThrowsError(async () => await moduleRef.execute(['1', '2']))).toBeTrue();
        });

        it('Should not call the help modules handle error no help module is imported', async () => {
            importParserModule(moduleRef);
            spyOn(ParserModule.prototype, 'evalauteContext').and.returnValue({ ...ctx, route: null });
            expect(await asyncThrowsError(async () => await moduleRef.execute(['1', '2']))).toBeTrue();
        });

        it('Should initialize the option provider refs with the options evaluated from the parser module for all options relevalent to the route, when the route is resolved to a command', async () => {

            importParserModule(moduleRef);
            const mockOptions = [new MockOptions().applyMetadata(), new MockOptions().applyMetadata(), new MockOptions().applyMetadata()]
            const routeOptions = mockOptions.map(o => ({ constructorRef: o.constructorRef, moduleRef, providerRef: new OptionsProviderRef(o.constructorRef, moduleRef, []) }));
            const evaluatedOptions = [];
            ctx = { ...ctx, options: [{ rawName: '--o', cleanedName: 'o', isAlias: true, value: '4' }] };

            const parserSpy = spyOn(ParserModule.prototype, 'evaulateOptions').and.returnValue(evaluatedOptions);
            const optsProviderSpies = routeOptions.map(o => spyOn(o.providerRef, 'init'));
            const routeOptsSpy = spyOn(commandRoute, 'getOptions').and.returnValue(routeOptions);
            spyOn(commandRoute.command, 'resolveWithParameters').and.resolveTo({ execute: () => { } });
            spyOn(ParserModule.prototype, 'evalauteContext').and.returnValue({ ...ctx, route: commandRoute });

            await subModule.execute(['1', '2']);
            expect(parserSpy).toHaveBeenCalledWith(commandRoute, ctx.options);
            expect(routeOptsSpy).toHaveBeenCalled();
            expect(optsProviderSpies[0].calls.argsFor(0)[0]).toBe(evaluatedOptions);
            expect(optsProviderSpies[1].calls.argsFor(0)[0]).toBe(evaluatedOptions);
            expect(optsProviderSpies[2].calls.argsFor(0)[0]).toBe(evaluatedOptions);
        });

        it('Should create an instance of the command with the parsed parameters from the parser module and execute the command\'s function', async () => {

            importParserModule(moduleRef);
            const evaluatedParameters = [];
            ctx = { ...ctx, possibleParameters: ['a', 'b', 'c'], route: commandRoute };

            const parserSpy = spyOn(ParserModule.prototype, 'evaulateParameters').and.returnValue(evaluatedParameters);
            const fakeCommand = { execute: () => { } };
            const executeSpy = spyOn(fakeCommand, 'execute');
            const commandSpy = spyOn(commandRoute.command, 'resolveWithParameters').and.resolveTo(fakeCommand);
            spyOn(ParserModule.prototype, 'evalauteContext').and.returnValue(ctx);

            await subModule.execute(['1', '2']);
            expect(parserSpy.calls.argsFor(0)[0]).toBe(commandRoute.command.parameters);
            expect(parserSpy.calls.argsFor(0)[1]).toBe(ctx.possibleParameters);
            expect(commandSpy.calls.mostRecent().args[0]).toBe(evaluatedParameters);
            expect(executeSpy).toHaveBeenCalled();
        });

        it('Should instiantiate all modules in the execution path and trigger the command hooks', async () => {
            importParserModule(moduleRef);
            const modRefs = [createModule(Mod1), createModule(Mod2)];
            ctx = { ...ctx, route: commandRoute };
            const moduletreeSpy = spyOn(commandRoute, 'getModuleTree').and.returnValue(modRefs);
            spyOn(ParserModule.prototype, 'evalauteContext').and.returnValue(ctx);
            spyOn(commandRoute.command, 'resolveWithParameters').and.resolveTo({ execute: () => { } });
            await subModule.execute(['1', '2']);
            expect(moduletreeSpy).toHaveBeenCalled();
            expect(modRefs[0].resolve).toHaveBeenCalled();
            expect(modRefs[1].resolve).toHaveBeenCalled();
            expect(hookCalls.sort((a, b) => a > b ? -1 : 1)).toEqual(['mod1-hook2', 'mod1-hook3', 'mod2-hook3', 'mod2-hook1'].sort((a, b) => a > b ? -1 : 1));
        });

        it('Should execute a command in with a specific order => initialize options => initialise module instances => inititalise command instance => before execute hooks => execute command => after execute hooks', async () => {

            importParserModule(moduleRef);
            const ref = new ModuleRef(Mod1, registry.registry, null);
            spyOn(OptionsProviderRef.prototype, 'init').and.callFake(async () => { callOrder.push(1); });
            spyOn(commandRoute, 'getOptions').and.returnValue([{ constructorRef: new MockOptions().applyMetadata().constructorRef, moduleRef, providerRef: new OptionsProviderRef(new MockOptions().applyMetadata().constructorRef, null, []) }]);

            spyOn(ref, 'resolve').and.callFake(async () => { callOrder.push(2); return new Mod1(); });
            spyOn(commandRoute, 'getModuleTree').and.returnValue([ref]);

            const fakeCommand = { execute: () => { } };
            spyOn(fakeCommand, 'execute').and.callFake(() => callOrder.push(5));
            spyOn(commandRoute.command, 'resolveWithParameters').and.callFake(async () => { callOrder.push(3); return fakeCommand; });

            spyOn(ParserModule.prototype, 'evalauteContext').and.returnValue({ ...ctx, route: commandRoute });
            await subModule.execute(['1', '2']);
            expect(callOrder.reduce((prev, cur) => [...prev, ...(prev.indexOf(cur) === -1 ? [cur] : prev)], [])).toEqual([1, 2, 3, 4, 5, 6]);
        });


    });

});
