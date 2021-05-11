import { MockCommand } from '../commands/commands';
import { MockModule, MockExport } from './mock-module';
import { Command, CommandRouteDefinition, ConfiguredModule } from './../../../src';
import { MockRoute } from './mock-route';
import { ModuleRef } from '../../../src/internal/module/module-ref';
import { CommandRef } from '../../../src/internal/command/command-ref';


interface ExecutionPath {
    modules: ModuleRef[];
    command: CommandRef;
}

export class MockModuleBuilder {

    private _commands: MockCommand<Command>[] = [];
    private _modules: MockModule[] = [];
    private _currentModule: MockModule;
    private _parents: MockModule[] = [];
    private _root: MockModule;

    constructor() {
    }

    root() {
        return this._root;
    }

    current() {
        return this._currentModule;
    }

    call(fn: (builder: MockModuleBuilder) => any) {
        fn(this);
        return this;
    }

    from(
        fnOrModel: ((builder: MockModuleBuilder) => MockModule) | MockModule,
    ) {
        this._root = fnOrModel instanceof Function ? fnOrModel(this) : fnOrModel;
        this._currentModule = this._root;
        return this;
    }

    addRoute(
        fnOrModel: ((builder: MockModuleBuilder) => MockModule | MockCommand<Command>) | MockModule | MockCommand<Command>,
        opts?: Partial<Omit<CommandRouteDefinition, 'command'>>
    ) {
        const model = fnOrModel instanceof Function ? fnOrModel(this) : fnOrModel;
        this._currentModule.addRoute(model instanceof MockCommand ?
            new MockRoute().fromCommand(model, opts) :
            new MockRoute().fromModule(model, opts)
        );
        return this;
    }


    removeRoute(
        fnOrModel: ((builder: MockModuleBuilder) => MockModule | MockCommand<Command>) | MockModule | MockCommand<Command>,
    ) {
        const model = fnOrModel instanceof Function ? fnOrModel(this) : fnOrModel;
        const route = this._currentModule.mockRoutes.find(r => r.mockCommand === model || r.mockModule === model);
        if (!route) {
            throw Error(`Module builder can't find route to remove`);
        }
        this._currentModule.removeRoute(this._currentModule.mockRoutes.indexOf(route));
        return this;
    }

    addRouteAndSelect(
        fnOrModel: ((builder: MockModuleBuilder) => MockModule) | MockModule,
        opts?: Partial<Omit<CommandRouteDefinition, 'command'>>
    ) {
        const model = fnOrModel instanceof Function ? fnOrModel(this) : fnOrModel;
        this._currentModule.addRoute(new MockRoute().fromModule(model, opts));
        this._parents.push(this._currentModule);
        this._currentModule = model;
        return this;
    }

    createExecutionPath(
        fnOrModel: ((builder: MockModuleBuilder) => MockCommand<Command>) | MockCommand<Command>
    ): ExecutionPath {

        this.build();
        const model = fnOrModel instanceof Function ? fnOrModel(this) : fnOrModel;
        const findCommand = (mockModule: MockModule, parents: MockModule[]) => {

            let result = {
                parents: [...parents, mockModule],
                route: mockModule.mockRoutes.find(r => r.mockCommand === model),
            };

            if (!result.route) {
                for (const childModule of mockModule.mockRoutes.filter(r => !!r.mockModule).map(r => r.mockModule)) {
                    result = findCommand(childModule, result.parents);
                    if (result?.route) {
                        return result;
                    }
                }
            } else {
                // handle exported modules here
            }

            return result;
        };
        const resolvedPath = findCommand(this._root, []);
        if (resolvedPath && resolvedPath.route) {
            return {
                modules: resolvedPath.parents.map(m => m.moduleRef),
                command: resolvedPath.route.registeredRoute.command
            };
        } else {
            throw new Error(`Module builder could find find the module to select`);
        }

    }


    selectParent() {
        if (this._parents.length) {
            this._currentModule = this._parents[this._parents.length - 1];
            this._parents.splice(this._parents.length - 1, 1);
        } else {
            throw new Error(`Module builder can't select parent becuase it is already the root level`);
        }
        return this;
    }

    routeFor(
        fnOrModel: ((builder: MockModuleBuilder) => MockModule | MockCommand<Command>) | MockModule | MockCommand<Command>,
    ) {
        const model = fnOrModel instanceof Function ? fnOrModel(this) : fnOrModel;
        const findRoute = (mockModule: MockModule) => {
            let route = mockModule.mockRoutes.find(r => r.mockCommand === model || r.mockModule === model);
            if (!route) {
                for (const childModule of mockModule.mockRoutes.filter(r => !!r.mockModule).map(r => r.mockModule)) {
                    route = findRoute(childModule);
                    if (route) {
                        return route;
                    }
                }
            }
            return route;
        };
        const foundRoute = findRoute(this._root);
        if (!foundRoute) {
            throw new Error(`Module builder could not find any routes in the module tree that match the provided MockCommand or MockModule`);
        }
        return foundRoute;
    }

    selectRoot() {
        this._parents = [];
        this._currentModule = this._root;
        return this;
    }

    selectModule(
        fnOrModel: ((builder: MockModuleBuilder) => MockModule) | MockModule,
    ) {
        const model = fnOrModel instanceof Function ? fnOrModel(this) : fnOrModel;
        this._parents = [];
        if (model === this._root) {
            this._currentModule = this._root;
        } else {
            const findModule = (mockModule: MockModule, parents: MockModule[]) => {

                let result = {
                    parents: [...parents, mockModule],
                    foundModule: mockModule.mockRoutes.find(r => r.mockModule === model).mockModule
                };

                if (!result.foundModule) {
                    for (const childModule of mockModule.mockRoutes.filter(r => !!r.mockModule).map(r => r.mockModule)) {
                        result = findModule(childModule, result.parents);
                        if (result?.foundModule) {
                            return result;
                        }
                    }
                }

                return result;
            };
            const resolvedModule = findModule(this._root, []);
            if (resolvedModule) {
                this._parents = resolvedModule.parents;
                this._currentModule = resolvedModule.foundModule;
            } else {
                throw new Error(`Module builder could find find the module to select`);
            }

        }
        return this;
    }

    addExport(exprt: MockExport | ((builder: MockModuleBuilder) => MockExport)) {
        if (exprt instanceof Function) {
            this._currentModule.addExport(exprt(this));
        } else {
            this._currentModule.addExport(exprt);
        }
        return this;
    }

    build() {
        this._root.createModuleRef();
        return this;
    }


    buildWithMockImports(configured?: ConfiguredModule) {
        this._root.createModuleRefWithMockImports(configured);
        return this;
    }


    getCommand(index: number): MockCommand<any> {
        if (this._commands[index]) {
            return this._commands[index];
        } else {
            throw new Error(`Mock module builder: No commands exist at index ${index}`);
        }
    }

    getModule(index: number) {
        if (this._modules[index]) {
            return this._modules[index];
        } else {
            throw new Error(`Mock module builder: No modules exist at index ${index}`);
        }
    }

    addCommand(command: MockCommand<Command>) {
        this._commands.push(command);
        return this;
    }

    addModule(mockModule: MockModule) {
        this._modules.push(mockModule);
        return this;
    }

}
