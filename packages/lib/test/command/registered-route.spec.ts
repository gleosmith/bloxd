import { MockRoute, MockCommand, MockModule, MockOptions, getOptionMetadata } from '../shared';
import { RegisteredRoute } from '../../src/internal/command/registered-route';
import { RouteUtils } from '../../src/internal/command/route-utils';
import { OptionsProviderRef } from '../../src/internal/options/option-provider-ref';
import { OptionsLink } from '../../src/internal/options/options-link';

describe('RegisteredRoute[class]', () => {

    let mockModule: MockModule;
    let importModule: MockModule;
    let options: MockOptions[];

    beforeEach(() => {
        mockModule = new MockModule()
            .addRoute(
                new MockRoute().fromCommand(
                    new MockCommand()
                        .setName('cmd')
                        .applyMetadata()
                )
            ).addRoute(
                new MockRoute()
                    .fromModule(new MockModule().createModuleRef())
                    .updateOpts({ path: 'p2' })
            );
        importModule = new MockModule()
            .addRoute(new MockRoute().fromModule(new MockModule()))
            .createModuleRef();
        options = [
            new MockOptions()
                .addOption('options1', { alias: 'o1' })
                .addOption('options2', { alias: 'o2' }),
            new MockOptions()
                .addOption('options3', { alias: 'o3' }),
            new MockOptions()
                .addOption('options4', { alias: 'o4' })
                .addOption('options5', { alias: 'o5' }),
            new MockOptions()
                .addOption('options6', { alias: 'o6' }),
            new MockOptions()
                .addOption('options7', { alias: 'o7' })
        ];
    });

    describe('fromCommandRoute()[static]', () => {

        it('Should create a new registered route where the path, description, data, alias and isCommand properties are taken from the RouteUtils hellpers', () => {
            mockModule.createModuleRef();
            const spy1 = spyOn(RouteUtils, 'isCommand').and.returnValue(true);
            const spy2 = spyOn(RouteUtils, 'getAlias').and.returnValue('a');
            const spy3 = spyOn(RouteUtils, 'getData').and.returnValue('d');
            const spy4 = spyOn(RouteUtils, 'getDescription').and.returnValue('f');
            const spy5 = spyOn(RouteUtils, 'getPath').and.returnValue('z');
            const route = RegisteredRoute.fromCommandRoute(mockModule.routes[1], mockModule.registeredRoutes[1].module);

            expect(spy1).toHaveBeenCalledWith(mockModule.routes[1]);
            expect(spy2).toHaveBeenCalledWith(mockModule.routes[1]);
            expect(spy3).toHaveBeenCalledWith(mockModule.routes[1]);
            expect(spy4).toHaveBeenCalledWith(mockModule.routes[1]);
            expect(spy5).toHaveBeenCalledWith(mockModule.routes[1]);

            expect(route.isCommand).toBe(true);
            expect(route.alias).toBe('a');
            expect(route.data).toBe('d');
            expect(route.description).toBe('f');
            expect(route.path).toBe('z');

        });

        it('Should set the module to the module ref when the route is a module route', () => {
            mockModule.createModuleRef();
            const route = RegisteredRoute.fromCommandRoute(mockModule.routes[1], mockModule.registeredRoutes[1].module);
            expect(route.module).toBe(mockModule.registeredRoutes[1].module);
            expect(route.command).toBe(undefined);
        });

        it('Should set the command to the command ref when the route is a command route', () => {
            mockModule.createModuleRef();
            const route = RegisteredRoute.fromCommandRoute(mockModule.routes[0], mockModule.registeredRoutes[0].command);
            expect(route.module).toBe(undefined);
            expect(route.command).toBe(mockModule.registeredRoutes[0].command);
        });

    });

    describe('fromRegisteredRoute()[static]', () => {

        it('Should create a new route copying the details from the previous route', () => {
            mockModule.mockRoutes[0]
                .updateOpts({ path: 'p', alias: 'c', data: 'd', description: 'd' });
            mockModule.createModuleRef();

            const result = RegisteredRoute.fromRegisteredRoute(mockModule.registeredRoutes[0], importModule.moduleRef);
            expect(result.command).toBe(mockModule.registeredRoutes[0].command);
            expect(result.alias).toBe(mockModule.registeredRoutes[0].alias);
            expect(result.description).toBe(mockModule.registeredRoutes[0].description);
            expect(result.data).toBe(mockModule.registeredRoutes[0].data);
            expect(result.path).toBe(mockModule.registeredRoutes[0].path);
        });

    });

    describe('constructor()', () => {

        it('Should set the properties provided in the constructor', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({
                alias: 'a',
                path: 'p',
                description: 'd',
                data: 1,
                command: mockModule.registeredRoutes[0].command,
                module: mockModule.registeredRoutes[1].module
            });
            expect(result.command).toBe(mockModule.registeredRoutes[0].command);
            expect(result.module).toBe(mockModule.registeredRoutes[1].module);
            expect(result.alias).toBe('a');
            expect(result.description).toBe('d');
            expect(result.data).toBe(1);
            expect(result.path).toBe('p');
        });

        it('The parents should taken from the import module if provided', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({ command: mockModule.registeredRoutes[0].command, isCommand: true }, importModule.registeredRoutes[0].module);
            expect(result.parentModules).toEqual([importModule.moduleRef, importModule.registeredRoutes[0].module]);
        });

        it('The export module should be set to the command\'s parent where an import module is provided and the route is a command route', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({ command: mockModule.registeredRoutes[0].command, isCommand: true }, importModule.registeredRoutes[0].module);
            expect(result.exportModule).toEqual(mockModule.registeredRoutes[0].command.parent);
        });

        it('The export module should be set to the modules parent where an import module is provided and the route is a module route', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({ module: mockModule.registeredRoutes[1].module, isCommand: false }, importModule.registeredRoutes[0].module);
            expect(result.exportModule).toEqual(mockModule.registeredRoutes[1].module.parent);
        });

        it('The export module should be undefined where no import module is provided', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({ module: mockModule.registeredRoutes[1].module, isCommand: false });
            expect(result.exportModule).toEqual(undefined);
        });

        it('The parent modules should be taken as the commands parent if no import module is provided and the route is a command route', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({ command: mockModule.registeredRoutes[0].command, isCommand: true });
            expect(result.parentModules).toEqual([mockModule.moduleRef]);
        });

        it('The parent modules should be taken as the modules parents, if no import module is provided and the route is a module route', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({ module: mockModule.registeredRoutes[1].module, isCommand: false });
            expect(result.parentModules).toEqual([mockModule.moduleRef]);
        });

    });

    describe('getModuleTree()', () => {

        it('Should return all parents of the route ordered by from highest parent to lowest', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({ command: mockModule.registeredRoutes[0].command, isCommand: true });
            expect(result.getModuleTree()).toEqual(result.parentModules);
        });

        it('Should include the first parent as the export module and then include other parents where an export module is applicable', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({ command: mockModule.registeredRoutes[0].command, isCommand: true }, importModule.registeredRoutes[0].module);
            expect(result.getModuleTree()).toEqual([result.exportModule, ...result.parentModules]);
        });

        it('Should include include the module of the route if the route is a module route as the last item of the module tree', () => {
            mockModule.createModuleRef();
            const result = new RegisteredRoute({ module: mockModule.registeredRoutes[1].module, isCommand: false }, importModule.registeredRoutes[0].module);
            expect(result.getModuleTree()).toEqual([result.exportModule, ...result.parentModules, mockModule.registeredRoutes[1].module]);
        });

    });

    describe('getOptions()', () => {

        it('Should return the options links for all options in the module tree when the route is just a module route', () => {
            mockModule
                .addOptions(options[0])
                .addOptions(options[1])
                .mockRoutes[1].mockModule.addOptions(options[2]);
            mockModule.createModuleRef();
            importModule
                .addOptions(options[4])
                .mockRoutes[0].mockModule.addOptions(options[3]);
            importModule.createModuleRef();
            const route = new RegisteredRoute({ module: mockModule.registeredRoutes[1].module, isCommand: false }, importModule.registeredRoutes[0].module);

            expect(route.getOptions()).toEqual([
                ...mockModule.moduleRef.options,
                ...importModule.moduleRef.options,
                ...importModule.registeredRoutes[0].module.options,
                ...mockModule.registeredRoutes[1].module.options
            ]);
        });

        it('Should should not contain any duplicates where the same options exist in more than one module', () => {
            mockModule
                .addOptions(options[0])
                .addOptions(options[1])
                .addOptions(options[3])
                .mockRoutes[1].mockModule.addOptions(options[2]).addOptions(options[1]);
            mockModule.createModuleRef();
            importModule
                .addOptions(options[4])
                .mockRoutes[0].mockModule.addOptions(options[3]);
            importModule.createModuleRef();
            const opts = new RegisteredRoute({ module: mockModule.registeredRoutes[1].module, isCommand: false }, importModule.registeredRoutes[0].module).getOptions();
            expect(opts.filter(o => o.constructorRef === options[1].constructorRef).length).toEqual(1);
            expect(opts.filter(o => o.constructorRef === options[3].constructorRef).length).toEqual(1);
        });

        it('Should include the options of the command where the route is a command route', () => {
            mockModule
                .mockRoutes[0].mockCommand.addOptions(options[2]);
            mockModule.createModuleRef();
            importModule
                .addOptions(options[1])
                .addOptions(options[4])
                .mockRoutes[0].mockModule.addOptions(options[3]);
            importModule.createModuleRef();
            const route = new RegisteredRoute({ command: mockModule.registeredRoutes[0].command, isCommand: true }, importModule.registeredRoutes[0].module);

            expect(route.getOptions()).toEqual([
                ...mockModule.moduleRef.options,
                ...importModule.moduleRef.options,
                ...importModule.registeredRoutes[0].module.options,
                ...mockModule.registeredRoutes[0].command.options
            ]);
        });
    });




    describe('getOptionsMetadata()', () => {

        const buildOptions = () => {
            mockModule
                .addOptions(options[0])
                .addOptions(options[1])
                .mockRoutes[1].mockModule.addOptions(options[2]);
            mockModule.createModuleRef();
            importModule
                .addOptions(options[4])
                .mockRoutes[0].mockModule.addOptions(options[3]);
            importModule.createModuleRef();

            [
                ...mockModule.moduleRef.options,
                ...importModule.moduleRef.options,
                ...importModule.registeredRoutes[0].module.options,
                ...mockModule.registeredRoutes[1].module.options
            ].forEach(o => o.providerRef = new OptionsProviderRef(o.constructorRef, new MockModule().createModuleRef().moduleRef, []));

            const reduceOpts = (opts: OptionsLink[]) => opts.reduce((prev, cur) => [...prev, ...cur.providerRef.optionsMetadata], []);

            return [
                ...reduceOpts(mockModule.moduleRef.options),
                ...reduceOpts(importModule.moduleRef.options),
                ...reduceOpts(importModule.registeredRoutes[0].module.options),
                ...reduceOpts(mockModule.registeredRoutes[1].module.options)
            ];
        };

        it('Should return this options metadata for all options in the execution path', () => {
            const opts = buildOptions();
            const route = new RegisteredRoute({ module: mockModule.registeredRoutes[1].module, isCommand: false }, importModule.registeredRoutes[0].module);
            expect(route.getOptionsMetadata()).toEqual(opts);
        });

        it('Should remove duplicate options by their alias, name, required status, design type and description when the unique flag is true', () => {
            options[0]
                .modifyOption('options1', { name: 'n', description: 'd', alias: 'a', required: true, designType: String })
                .modifyOption('options2', { name: 'n2', description: 'd2', alias: 'a2', required: false, designType: Number });
            options[2]
                .modifyOption('options4', { name: 'n', description: 'd', alias: 'a', required: true, designType: String })
                .modifyOption('options5', { name: 'n2', description: 'd2', alias: 'a2', required: false, designType: Number });

            const opts = buildOptions();
            const route = new RegisteredRoute({ module: mockModule.registeredRoutes[1].module, isCommand: false }, importModule.registeredRoutes[0].module);
            expect(route.getOptionsMetadata(true)).toEqual([opts[0], opts[1], opts[2], opts[3], opts[4]]);
        });

    });

    describe('getMappedOptions()', () => {
        it('Should return all option defintions mapped to their constructor', () => {

            mockModule
                .addOptions(options[0])
                .addOptions(options[1])
                .mockRoutes[1].mockModule.addOptions(options[2]);
            mockModule.createModuleRef();
            importModule
                .addOptions(options[4])
                .mockRoutes[0].mockModule.addOptions(options[3]);
            importModule.createModuleRef();
            const route = new RegisteredRoute({ module: mockModule.registeredRoutes[1].module, isCommand: false }, importModule.registeredRoutes[0].module);

            expect(route.getMappedOptions()).toEqual([
                { class: options[0].constructorRef, def: options[0].getOptionMetadata('options1') },
                { class: options[0].constructorRef, def: options[0].getOptionMetadata('options2') },
                { class: options[1].constructorRef, def: options[1].getOptionMetadata('options3') },
                { class: options[4].constructorRef, def: options[4].getOptionMetadata('options7') },
                { class: options[3].constructorRef, def: options[3].getOptionMetadata('options6') },
                { class: options[2].constructorRef, def: options[2].getOptionMetadata('options4') },
                { class: options[2].constructorRef, def: options[2].getOptionMetadata('options5') },
            ]);

        });
    });



});
