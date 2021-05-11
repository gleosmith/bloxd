import { HelpModule, COMMAND_HELP, DefaultCommandHelp, MODULE_HELP, DefaultModuleHelp, AppContext, HelpUtilities, CommandDescription } from '../../src';
import { HELP_ERRORS, defaultHelpErrors } from '../../src/internal/help/help-errors';
import {
    MockModuleBuilder, MockCommand, MockModule, MockOptions, createModuleDescription, commandDescriptionFromRoute,
    paramDescriptionFromMetadata, optDescriptionFromMetadata, moduleDescriptionFromRoute
} from '../shared';
import { ModuleDescription } from '../../src/internal/module/module-models';
import { Type } from '../../src/internal/common/cli-types';

describe('HelpModule[class]', () => {

    describe('customize()[static]', () => {

        it('Should return a configured module with the HelpModule', () => {
            expect(HelpModule.customize().module).toBe(HelpModule);
        });

        it('If no implementations are passed into the function it should not return any providers or exports', () => {
            const { providers, exports } = HelpModule.customize();
            expect(providers).not.toContain({ provide: COMMAND_HELP, useClass: DefaultCommandHelp });
            expect(providers).not.toContain({ provide: MODULE_HELP, useClass: DefaultModuleHelp });
            expect(providers).not.toContain({ provide: HELP_ERRORS, useValue: defaultHelpErrors });
            expect(exports).not.toContain({ provide: COMMAND_HELP, useClass: DefaultCommandHelp });
            expect(exports).not.toContain({ provide: MODULE_HELP, useClass: DefaultModuleHelp });
            expect(exports).not.toContain({ provide: HELP_ERRORS, useValue: defaultHelpErrors });
        });

        it('If no implementations are passed into the function it should not return any providers or exports', () => {
            const { providers, exports } = HelpModule.customize();
            expect(providers).not.toContain({ provide: COMMAND_HELP, useClass: DefaultCommandHelp });
            expect(providers).not.toContain({ provide: MODULE_HELP, useClass: DefaultModuleHelp });
            expect(providers).not.toContain({ provide: HELP_ERRORS, useValue: defaultHelpErrors });
            expect(exports).not.toContain({ provide: COMMAND_HELP, useClass: DefaultCommandHelp });
            expect(exports).not.toContain({ provide: MODULE_HELP, useClass: DefaultModuleHelp });
            expect(exports).not.toContain({ provide: HELP_ERRORS, useValue: defaultHelpErrors });
        });

        it('Should return the provided implementation and export of the command help whether it is provided as a value or a class', () => {
            const fakeHelp = {
                showHelp: (des: any) => null
            };
            expect(HelpModule.customize({ commands: fakeHelp }).providers).toContain({ provide: COMMAND_HELP, useValue: fakeHelp });
            expect(HelpModule.customize({ commands: fakeHelp }).exports).toContain({ provide: COMMAND_HELP, useValue: fakeHelp });
            expect(HelpModule.customize({ commands: DefaultCommandHelp }).providers).toContain({ provide: COMMAND_HELP, useClass: DefaultCommandHelp });
            expect(HelpModule.customize({ commands: DefaultCommandHelp }).exports).toContain({ provide: COMMAND_HELP, useClass: DefaultCommandHelp });
        });

        it('Should return the provided implementation and export of the module help whether it is provided as a value or a class', () => {
            const fakeHelp = {
                showHelp: (des: any) => null
            };
            expect(HelpModule.customize({ modules: fakeHelp }).providers).toContain({ provide: MODULE_HELP, useValue: fakeHelp });
            expect(HelpModule.customize({ modules: fakeHelp }).exports).toContain({ provide: MODULE_HELP, useValue: fakeHelp });
            expect(HelpModule.customize({ modules: DefaultModuleHelp }).providers).toContain({ provide: MODULE_HELP, useClass: DefaultModuleHelp });
            expect(HelpModule.customize({ modules: DefaultModuleHelp }).exports).toContain({ provide: MODULE_HELP, useClass: DefaultModuleHelp });
        });

        it('Should return the provided help errors and export these errors ', () => {
            const errors = [class { }, class { }];
            expect(HelpModule.customize({ onErrors: errors }).providers).toContain({ provide: HELP_ERRORS, useValue: errors });
            expect(HelpModule.customize({ onErrors: errors }).exports).toContain({ provide: HELP_ERRORS, useValue: errors });
        });


    });

    describe('handleHelpError()', () => {

        let commandHelp: DefaultCommandHelp;
        let moduleHelp: DefaultModuleHelp;
        let helpModule: HelpModule;
        let builder: MockModuleBuilder;
        let description: ModuleDescription;
        let appContext: AppContext;
        let moduleSpy: jasmine.Spy<(description: ModuleDescription, err: Error) => void>;
        let commandSpy: jasmine.Spy<(description: CommandDescription, err: Error) => void>;
        let error: Error;

        beforeEach(() => {
            appContext = new AppContext('cli', '1.0.0');
            commandHelp = new DefaultCommandHelp(new HelpUtilities());
            moduleHelp = new DefaultModuleHelp(new HelpUtilities());
            helpModule = new HelpModule(commandHelp, moduleHelp, [], appContext);
            moduleSpy = spyOn(moduleHelp, 'showHelp');
            commandSpy = spyOn(commandHelp, 'showHelp');
            error = new Error();

            builder = new MockModuleBuilder()
                .addCommand(new MockCommand('cmd1')
                    .updateOpts({ alias: 'c', description: 'C1', data: 1 })
                    .addParameter<any>('param1', { data: 5, optional: true, description: 'P1', designType: String, isArray: false })
                    .addParameter<any>('param2', { data: '20', optional: false, description: 'P2', designType: Number, isArray: false })
                    .addOptions(
                        new MockOptions()
                            .addOption('op1', { data: 70, alias: 'o1', required: true, description: 'O1', designType: Array })
                    )
                )
                .addCommand(new MockCommand('cmd1')
                    .updateOpts({ alias: 'c2', description: 'B', data: 12 })
                )
                .addModule(new MockModule()
                    .addOptions(new MockOptions()
                        .addOption('op2', { data: 31, alias: 'o2', required: false, description: 'O2', designType: Number })
                    )
                )
                .addModule(new MockModule())
                .from(b => b.getModule(0))
                .addRoute(b => b.getCommand(0))
                .addRouteAndSelect(b => b.getModule(1))
                .addRoute(b => b.getCommand(1))
                .selectRoot()
                .build();

            description = createModuleDescription({
                name: 'cli',
                description: undefined,
                commands: [
                    commandDescriptionFromRoute(builder.root().registeredRoutes[0], {
                        parameters: builder.getCommand(0).parameterMetadata.map(p => paramDescriptionFromMetadata(p)),
                        options: [
                            ...builder.getModule(0).getOptions(0).optionsMetadata.map(o => optDescriptionFromMetadata(o)),
                            ...builder.getCommand(0).getOptions(0).optionsMetadata.map(o => optDescriptionFromMetadata(o))
                        ]
                    })
                ],
                subCommands: [
                    moduleDescriptionFromRoute(builder.root().registeredRoutes[1], {
                        commands: [
                            commandDescriptionFromRoute(builder.getModule(1).registeredRoutes[0], {
                                parameters: builder.getCommand(1).parameterMetadata.map(p => paramDescriptionFromMetadata(p)),
                                options: [
                                    ...builder.getModule(0).getOptions(0).optionsMetadata.map(o => optDescriptionFromMetadata(o))
                                ]
                            })
                        ]
                    })
                ]
            });
            description.commands[0].parent = description;
            description.subCommands[0].parent = description;
            description.subCommands[0].commands[0].parent = description.subCommands[0];
        });

        it('Should call the command help with the applicable command description', async () => {
            await helpModule.handleHelpError(builder.root().moduleRef, builder.routeFor(builder.getCommand(0)).registeredRoute, error);
            expect(commandSpy).toHaveBeenCalledWith(description.commands[0], error);
        });

        it('Should call the command help with the applicable command description when the command is part of a sub command module', async () => {
            await helpModule.handleHelpError(builder.root().moduleRef, builder.routeFor(builder.getCommand(1)).registeredRoute, error);
            expect(commandSpy).toHaveBeenCalledWith(description.subCommands[0].commands[0], error);
        });

        it('Should call the module help with the applicable sub module description when the route is a module route', async () => {
            await helpModule.handleHelpError(builder.root().moduleRef, builder.routeFor(builder.getModule(1)).registeredRoute, error);
            expect(moduleSpy).toHaveBeenCalledWith(description.subCommands[0], error);
        });

        it('Should call the module help with the root module description where the route is null', async () => {
            await helpModule.handleHelpError(builder.root().moduleRef, null, error);
            expect(moduleSpy).toHaveBeenCalledWith(description, error);
        });

    });

    describe('handleHelpError()', () => {

        class HelpError {}
        const createHelpModuleWithErrors = (errors: Type<any>[]) => {
            return new HelpModule(new DefaultCommandHelp(new HelpUtilities()), new DefaultModuleHelp(new HelpUtilities()), errors, new AppContext('cli', '1.0.0'));
        };

        it('Should return true when the error is an instance of one of the help errors', () => {
            expect(createHelpModuleWithErrors([HelpError]).isHelpError(new HelpError())).toBeTrue();
        });

        it('Should return true when the error is an instance of one of the help errors', () => {
            expect(createHelpModuleWithErrors([class OtherHelpError {}]).isHelpError(new HelpError())).toBeFalse();
        });

    });

});
