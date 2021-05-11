import { MockCommand } from '../commands/commands';
import { MockModule } from './mock-module';
import { Command, CommandRouteDefinition, CommandRoute } from '../../../src';
import { CommandRef } from '../../../src/internal/command/command-ref';
import { ModuleRef } from '../../../src/internal/module/module-ref';
import { RegisteredRoute } from '../../../src/internal/command/registered-route';

export class MockRoute {

    private _mockCommand: MockCommand<Command>;
    private _mockModule: MockModule;
    private _routeConfig: Omit<CommandRouteDefinition, 'command'>;
    private _commandRef: CommandRef;
    private _moduleRef: ModuleRef;
    private _registeredRoute: RegisteredRoute;


    private _path: string;
    private _description: string;
    private _data: any;
    private _alias: any;
    private _commandOptsModified = true;

    constructor() {
    }

    get path() {
        return this._path;
    }

    get description() {
        return this._description;
    }

    get data() {
        return this._data;
    }

    get alias() {
        return this._alias;
    }

    get isCommand() {
        return !!this._mockCommand;
    }

    get mockCommand() {
        return this._mockCommand;
    }

    get mockModule() {
        return this._mockModule;
    }

    get registeredRoute(): RegisteredRoute {
        if (!this._moduleRef && !this._commandRef) {
            throw new Error(`Can't access registered route from mock route before the route has been registered`);
        }
        return this._registeredRoute;
    }


    get opts(): Omit<CommandRouteDefinition, 'command'> {
        return {
            data: this.data,
            alias: this.alias,
            path: this.path,
            description: this.description
        };
    }

    get route(): CommandRoute {
        if (this._mockCommand) {
            if (this._commandOptsModified) {
                return {
                    ...this.opts,
                    command: this._mockCommand.constructorRef
                };
            } else {
                return this._mockCommand.constructorRef;
            }
        } else {
            return {
                ...this.opts,
                module: this._mockModule.constructorRef
            };
        }
    }


    clearOpts() {
        this._commandOptsModified = true;
        this._alias = undefined;
        this._description = undefined;
        this._data = undefined;
        this._alias = undefined;
        return this;
    }

    updateOpts(opts: Partial<Omit<CommandRouteDefinition, 'command'>>) {
        this._commandOptsModified = true;
        this._alias = opts.alias || this._alias;
        this._description = opts.description || this._description;
        this._data = opts.data || this._data;
        this._path = opts.path || opts.path;
        return this;
    }

    fromModule(mockModule: MockModule, opts?: Partial<Omit<CommandRouteDefinition, 'command'>>) {
        this._moduleRef = undefined;
        this._commandRef = undefined;
        this._mockModule = mockModule;
        this._commandOptsModified = true;
        this._mockCommand = undefined;
        this._path = opts?.path;
        this._alias = opts?.alias;
        this._description = opts?.description;
        this._data = opts?.data;
        return this;
    }

    fromCommand(command: MockCommand<Command>, opts?: Partial<Omit<CommandRouteDefinition, 'command'>>) {
        this._moduleRef = undefined;
        this._commandRef = undefined;
        this._commandOptsModified = opts ? !!Object.keys(opts).length : false;
        this._mockModule = undefined;
        this._mockCommand = command;
        this._path = opts?.path || command.name;
        this._description = opts?.description || command.commandMetadata.description;
        this._data = opts?.data || command.commandMetadata.description;
        this._alias = opts?.alias || command.commandMetadata.alias;
        return this;
    }

    applyMetadata() {
        if (this._mockModule) {
            this._mockModule.applyMetadata();
        } else {
            this._mockCommand.applyMetadata();
        }
    }

    removeMetadata() {
        if (this._mockModule) {
            this._mockModule.removeMetadata();
        } else {
            this._mockCommand.removeMetadata();
        }
    }

    register(moduleRef?: ModuleRef) {
        if (this._mockModule) {
            this._moduleRef = this._mockModule.createModuleRef().moduleRef;
            if (moduleRef) {
                this._moduleRef.parent = moduleRef;
                this._moduleRef.globalProviders = moduleRef.globalProviders;
            }
        } else {
            this._commandRef = this._mockCommand.applyMetadata().commandRef();
            if (moduleRef) {
                this._commandRef.parent = moduleRef;
                this._commandRef.globalProviders = moduleRef.globalProviders;
            }
        }
        this._registeredRoute = new RegisteredRoute({
            ...this.opts,
            isCommand: !!this._mockCommand,
            command: this._commandRef,
            module: this._moduleRef
        });
        return this;
    }

    deregister(moduleRef?: ModuleRef) {
        this._moduleRef = undefined;
        this._commandRef = undefined;
        return this;
    }

}
