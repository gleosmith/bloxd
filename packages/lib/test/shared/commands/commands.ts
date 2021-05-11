import {
    ParameterDefinition, Command, EvaluatedParameter, CommandOpts,
    CliCommand, CliParameterOpts, CliParameter
} from '../../../src';
import { CommandDefinition, CommandDescription } from '../../../src/internal/command/command-models';
import { CommandRef } from '../../../src/internal/command/command-ref';
import { dasherize } from '../../../src/internal/common/utils';
import { MockClass } from '../common/mock-class';
import { MockModule } from '../module/mock-module';
import { MockOptions } from '../options/options';
import 'reflect-metadata';
import { MetadataKey } from '../../../src/internal/common/meta-data';
import { MockMappedOptions } from '../parser/mapped-options';
import { MockRegistery } from '../app/mock-registry';


export const createParameter = (
    metadata: Partial<ParameterDefinition>
) => ({
    index: undefined,
    propertyName: undefined,
    name: undefined,
    description: undefined,
    optional: false,
    typeChecks: undefined,
    designType: undefined,
    data: undefined,
    ...metadata
}) as ParameterDefinition;


export class MockCommand<T extends Command> extends MockClass<T> {


    private _name: string;
    private _options: MockOptions[] = [];
    private _parameters: ParameterDefinition[] = [];
    private _parsedParameter: EvaluatedParameter[] = [];
    private _opts: Omit<CommandOpts, 'options'> = {};
    private appliedMetadata = false;
    private _parent: MockModule;
    private _description: CommandDescription;
    private _registry: MockRegistery;

    constructor(name?: string) {
        super();
        if (name) {
            this.setName(name);
        }
        this._registry = new MockRegistery();
    }

    get mockRegistry() {
        return this._registry;
    }

    get mockModule() {
        return this._parent;
    }

    get mockOptions() {
        return this._options;
    }

    get options() {
        return this._options.map(o => o.constructorRef);
    }

    get opts(): Omit<CommandOpts, 'options'> {
        return this._opts;
    }

    setParent(mod: MockModule) {
        this._parent = mod;
        return this;
    }

    setRegistry(reg: MockRegistery) {
        this._registry = reg;
        return this;
    }

    get name() {
        return this._name;
    }

    get parameterMetadata() {
        return this._parameters;
    }

    get parsedParameters() {
        return this._parsedParameter;
    }

    get commandMetadata(): CommandDefinition {
        return {
            name: this.name,
            constructor: this.constructorRef,
            options: this._options.map(o => o.constructorRef),
            alias: undefined,
            description: undefined,
            data: undefined,
            providers: [],
            ...this._opts
        };
    }

    commandRef() {
        if (!this.appliedMetadata) {
            this.applyMetadata();
        }
        if (this._parent) {
            if (!this._parent.moduleRef) {
                this._parent.createModuleRef();
            }
        }
        return new CommandRef(this.constructorRef, this._registry.registry.providers, this._parent?.moduleRef, this._registry.registry);
    }

    commandDecorator(opts?: CommandOpts): ClassDecorator {
        return CliCommand(this.name, {
            ...this._opts,
            options: this._options.length ? (this._options.length > 1 ? this._options.map(o => o.constructorRef) : this._options[0].constructorRef) : undefined,
            ...(opts || {}),
        });
    }

    parameterDecorator<K extends keyof T>(propertyName: K, opts?: CliParameterOpts): PropertyDecorator {
        const metadata = this.getParameterMetadata(propertyName);
        return CliParameter(metadata.index, { ...this.getParameterOpts(propertyName), ...(opts || {}) });
    }

    applyMetadata() {
        super.applyMetadata();
        this._options.forEach(o => o.applyMetadata());
        Reflect.defineMetadata(MetadataKey.Command, this.commandMetadata, this.constructorRef);
        Reflect.defineMetadata(MetadataKey.Parameter, this._parameters, this.constructorRef);
        this.appliedMetadata = true;
        return this;
    }

    removeMetadata() {
        super.removeMetadata();
        this._options.forEach(o => o.removeMetadata());
        Reflect.deleteMetadata(MetadataKey.Command, this.constructorRef);
        Reflect.deleteMetadata(MetadataKey.Parameter, this.constructorRef);
        this.appliedMetadata = false;
        return this;
    }

    updateOpts(opts: Partial<Omit<CommandOpts, 'options'>>) {
        this._opts = { ...this._opts, ...opts };
        return this;
    }

    resetOpts() {
        this._opts = {};
        return this;
    }

    getOptions(index: number) {
        if (this._options[index]) {
            return this._options[index];
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

    getParameterMetadata<K extends keyof T>(propertyName: K) {
        const metadata = this._parameters.find(p => p.propertyName === propertyName);
        if (!metadata) {
            throw new Error(`Can't get metadata for the property ${propertyName} because it does not exist`);
        }
        return metadata;
    }

    getParameterOpts<K extends keyof T>(propertyName: K): CliParameterOpts {
        let metadata = this.getParameterMetadata(propertyName);
        if (metadata) {
            metadata = { ...metadata };
            delete metadata.designType;
            delete metadata.index;
            if (metadata.name === dasherize(metadata.propertyName)) {
                delete metadata.name;
            }
            delete metadata.propertyName;
            return metadata;
        }
        return undefined;
    }

    addParameter<K extends keyof T>(propertyName: K, metadata: Partial<Omit<ParameterDefinition, 'propertyName'>>, defaultValue?: any) {
        super.addProperty(propertyName, metadata.designType, defaultValue);
        this._parameters.push(createParameter({
            propertyName: propertyName as string,
            name: dasherize(propertyName as string),
            index: this._parameters.length,
            ...metadata
        }));
        return this;
    }

    addParsedParam<K extends keyof T>(propertyName: K, value: any) {
        const metadata = this.getParameterMetadata(propertyName);
        if (!metadata) {
            throw Error(`Cannot added the parsed parameter for ${propertyName} becuase the property does not exist`);
        }
        this._parsedParameter.push({ value, definition: metadata });
        return this;
    }

    modifyParsedParam<K extends keyof T>(propertyName: K, value: any) {
        const parsedParam = this._parsedParameter.find(p => p.definition.propertyName === propertyName);
        if (parsedParam) {
            this._parsedParameter[this._parsedParameter.indexOf(parsedParam)] = { value, definition: parsedParam.definition };
        } else {
            throw Error(`Cannot rmodify parsed parameter for ${propertyName} becuase the property does not exist`);
        }
        return this;
    }

    removeParsedParam<K extends keyof T>(propertyName: K) {
        const parsedParam = this._parsedParameter.find(p => p.definition.propertyName === propertyName);
        if (parsedParam) {
            this._parsedParameter.splice(this._parsedParameter.indexOf(parsedParam), 1);
        } else {
            throw Error(`Cannot remove parsed parameter for ${propertyName} becuase the property does not exist`);
        }
        return this;
    }

    removeParameter<K extends keyof T>(propertyName: K) {
        super.removeProperty(propertyName);
        const param = this._parameters.find(p => p.propertyName === propertyName);
        if (param) {
            this._parameters.splice(this._parameters.indexOf(param), 1);
        }
        const parsedParam = this._parsedParameter.find(p => p.definition.propertyName === propertyName);
        if (parsedParam) {
            this._parsedParameter.splice(this._parsedParameter.indexOf(parsedParam), 1);
        }
        this._parameters.forEach((p, i) => p.index = i + 1);
        return this;
    }

    modifyParameter<K extends keyof T>(propertyName: K, metadata: Partial<Omit<ParameterDefinition, 'propertyName'>>, defaultValue?: any) {
        super.modifyProperty(propertyName, metadata.designType, defaultValue);
        const param = this._parameters.find(p => p.propertyName === propertyName);
        if (param) {
            this._parameters[this._parameters.indexOf(param)] = createParameter({
                propertyName: propertyName as string,
                name: dasherize(propertyName as string),
                ...metadata
            });
        }
        const parsedParam = this._parsedParameter.find(p => p.definition.propertyName === propertyName);
        if (parsedParam) {
            this._parsedParameter[this._parsedParameter.indexOf(parsedParam)] = { value: parsedParam.value, definition: this._parameters[this._parameters.indexOf(param)] };
        }
        return this;
    }


    setName(name: string) {
        this._name = name;
        return this;
    }
}
