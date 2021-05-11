import { MockModule } from './../module/mock-module';
import { OptionDefinition, CliOptionOpts } from '../../../src/internal/options/option-models';
import { CliOptions, CliOption } from '../../../src/internal/options/option-decorator';
import { EvaluatedOption } from '../../../src/internal/parser/options-parser';
import { OptionsProviderRef } from '../../../src/internal/options/option-provider-ref';
import { Type } from '../../../src/internal/common/cli-types';
import { getMetadata, MetadataKey } from '../../../src/internal/common/meta-data';
import { dasherize } from '../../../src/internal/common/utils';
import { MockClass } from '../common/mock-class';
import 'reflect-metadata';
import { Provider } from '../../../src/internal/dependency-injection/providers';
import { Injector } from '../../../src/internal/dependency-injection/injector';
import { MockRegistery } from '../app/mock-registry';
import { ModuleRef } from '../../../src/internal/module/module-ref';

export const getOptionMetadata = <T extends any, Key extends keyof T>(
    cons: Type<T>,
    key: Key) => getMetadata<OptionDefinition[]>(MetadataKey.Option, cons).find(def => def.propertyName === key);


export const createOptionMetadata = (
    opt: Partial<OptionDefinition>
) => ({
    description: undefined,
    name: undefined,
    data: undefined,
    typeChecks: undefined,
    required: false,
    designType: undefined,
    propertyName: undefined,
    alias: undefined,
    ...opt
}) as OptionDefinition;



export class MockOptions<T = any> extends MockClass<T> {


    private _options: OptionDefinition[] = [];
    private _parsedOptions: EvaluatedOption[] = [];
    private _appliedMetadata: boolean;
    private _registry: MockRegistery;

    constructor() {
        super();
        this._registry = new MockRegistery();
    }

    get provider(): Provider {
        return this.constructorRef;
    }

    get mockRegistry() {
        return this._registry;
    }

    get parsedOptions() {
        return this._parsedOptions;
    }

    get optionsMetadata() {
        return this._options;
    }

    setRegistry(reg: MockRegistery) {
        this._registry = reg;
        return this;
    }

    optionsProviderRef(parent?: ModuleRef) {
        if (!this._appliedMetadata) {
            this.applyMetadata();
        }
        return new OptionsProviderRef(this.constructorRef, parent || new MockModule().createModuleRef().moduleRef, this._registry.registry.providers);
    }

    classDecorator(): ClassDecorator {
        return CliOptions();
    }

    optionDecorator<K extends keyof T>(propertyName: K, opts?: Partial<CliOptionOpts>): PropertyDecorator {
        return CliOption({ ...this.getOptionMetadata(propertyName), ...(opts ? opts : {}) });
    }

    applyMetadata() {
        super.applyMetadata();
        Reflect.defineMetadata(MetadataKey.Options, { providers: [] }, this.constructorRef);
        Reflect.defineMetadata(MetadataKey.Option, this._options, this.constructorRef);
        this._appliedMetadata = true;
        return this;
    }

    removeMetadata() {
        super.removeMetadata();
        Reflect.deleteMetadata(MetadataKey.Option, this.constructorRef);
        Reflect.deleteMetadata(MetadataKey.Options, this.constructorRef);
        this._appliedMetadata = false;
        return this;
    }

    getOptionMetadata<K extends keyof T>(propertyName: K): OptionDefinition {
        return this._options.find(o => o.propertyName === propertyName);
    }

    getOptionOpts<K extends keyof T>(propertyName: K): CliOptionOpts {
        let metadata = this._options.find(o => o.propertyName === propertyName);
        if (metadata) {
            metadata = { ...metadata };
            delete metadata.propertyName;
            delete metadata.designType;
            if (metadata.name === dasherize(metadata.propertyName)) {
                delete metadata.name;
            }
        }
        return undefined;
    }

    getParsedOption<K extends keyof T>(propertyName: K): EvaluatedOption {
        return this._parsedOptions.find(o => o.definition.propertyName === propertyName);
    }

    addOption<K extends keyof T>(propName: K, metadata: Partial<Omit<OptionDefinition, 'propertyName'>>, defaultValue?: any) {
        super.addProperty(propName, metadata.designType, defaultValue);
        this._options.push(createOptionMetadata({
            propertyName: propName as string,
            name: dasherize(propName as string),
            ...metadata
        }));
        return this;
    }

    modifyOption<K extends keyof T>(propName: K, metadata: Partial<Omit<OptionDefinition, 'propertyName'>>, defaultValue?: any) {
        super.modifyProperty(propName, metadata.designType, defaultValue);
        const option = this._options.find(o => o.propertyName === propName);
        this._options[this._options.indexOf(option)] = createOptionMetadata({
            propertyName: propName as string,
            ...metadata
        });
        const parsedOption = this._parsedOptions.find(p => p.definition.propertyName === propName);
        if (parsedOption) {
            this._parsedOptions[this._parsedOptions.indexOf(parsedOption)] = { value: parsedOption.value, definition: this._options[this._options.indexOf(option)] };
        }
        return this;
    }

    removeOption<K extends keyof T>(propName: K) {
        super.removeProperty(propName);
        const option = this._options.find(o => o.propertyName === propName);
        this._options.splice(this._options.indexOf(option), 1);
        const parsedOption = this._parsedOptions.find(p => p.definition.propertyName === propName);
        if (parsedOption) {
            this._parsedOptions.splice(this._parsedOptions.indexOf(parsedOption), 1);
        }
        return this;
    }

    addParsedOption<K extends keyof T>(propertyName: K, value: any) {
        const option = this._options.find(o => o.propertyName === propertyName);
        if (option) {
            this._parsedOptions.push({ value, definition: option });
        } else {
            throw new Error(`Cant add parsed option => No option properties exist with the ${propertyName}`);
        }
        return this;
    }

    modifyParsedOption<K extends keyof T>(propertyName: K, value: any) {
        const option = this._parsedOptions.find(p => p.definition.propertyName === propertyName);
        if (option) {
            this._parsedOptions[this._parsedOptions.indexOf(option)] = { value, definition: option.definition };
        } else {
            throw new Error(`Cant modify parsed option => No parsed options exist for the property name ${propertyName}`);
        }
        return this;
    }

    removeParsedOption<K extends keyof T>(propertyName: K) {
        const option = this._parsedOptions.find(p => p.definition.propertyName === propertyName);
        if (option) {
            this._parsedOptions.splice(this._parsedOptions.indexOf(option), 1);
        } else {
            throw new Error(`Cant remove parsed option =>  No parsed options exist for the property name ${propertyName}`);
        }
        return this;
    }


}
