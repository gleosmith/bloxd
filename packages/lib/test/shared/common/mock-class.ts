import 'reflect-metadata';
import { Type } from '../../../src/internal/common/cli-types';
import { MockProvider } from '../di/mock-provider';
import { InjectableArgDefinition } from '../../../src/internal/dependency-injection/injectable-arg-definition';
import { MetadataKey } from '../../../src/internal/common/meta-data';



export type ReflectionGetMetadata = (key: string, target: any, propertyKey?: string | Symbol) => any;
export type ClassDecoratorCall = (decorator: ClassDecorator, spy?: jasmine.Spy<ReflectionGetMetadata>) => jasmine.Spy<ReflectionGetMetadata>;
export type ParamDecoratorCall = (decorator: ParameterDecorator, index: number) => void;
export type PropDecoratorCall<T = any, K extends keyof T = any> = (decorator: PropertyDecorator, propertyName: K, spy?: jasmine.Spy<ReflectionGetMetadata>) => any;
export type MethodDecorator<T = any> = (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T> | PropertyDescriptor) => void | TypedPropertyDescriptor<T>;
export type FnDecoratorCall<T = any, K extends keyof T = any> = (decorator: MethodDecorator, propertyName: K) => any;

interface MockPropertyDefintion {
    name: string;
    designType?: Type<any>;
    defaultValue: any;
}

interface MockFunctionDefintion {
    name: string;
    returnType?: Type<any>;
    fn: (...args) => any;
}

interface MockConstructorParam {
    index: number;
    designType: Type<any>;
    provider?: MockProvider;
}


export class MockClass<T = any> {


    readonly constructorRef: Type<T> = class { } as Type<T>;
    private propertyDefintions: MockPropertyDefintion[] = [];
    private constructorParams: MockConstructorParam[] = [];
    private functionDefinitions: MockFunctionDefintion[] = [];
    private getMetadata = Reflect.getMetadata;

    constructor() {
    }

    get injectableProviders() {
        return this.constructorParams.filter(p => !!p.provider).map(p => p.provider.provider);
    }

    get injectableProviderRefs() {
        return this.constructorParams.filter(p => !!p.provider).map(p => p.provider.providerRef());
    }

    get injectableMetadata(): InjectableArgDefinition[] {
        return this.constructorParams.map(p => ({
            injectToken: p.provider ? p.provider.token : p.designType,
            index: p.index,
            optional: false
        }));
    }

    getInjectableMockProvider(index: number) {
        return this.constructorParams.find(p => p.index === index)?.provider;
    }

    getProviderRef(index: number) {
        return this.constructorParams.find(m => m.index === index)?.provider.providerRef();
    }

    getInjectableMetadata(index: number) {
        return this.injectableMetadata.find(m => m.index === index);
    }

    getInjectableProvider(index: number) {
        return this.constructorParams.find(m => m.index === index)?.provider.provider;
    }


    applyMetadata() {
        Reflect.defineMetadata(MetadataKey.InjectableArgs, this.injectableMetadata, this.constructorRef);
        return this;
    }

    removeMetadata() {
        Reflect.deleteMetadata(MetadataKey.InjectableArgs, this.constructorRef);
        return this;
    }

    createFnDecoratorCall<Key extends keyof T>(): FnDecoratorCall<T> {
        return (decorator: MethodDecorator, propertyName: Key, spy?: jasmine.Spy<ReflectionGetMetadata>) => {
            if (!this.functionDefinitions.find(p => p.name === propertyName)) {
                throw new Error(`Could not apply the method decorator becuase the function ${propertyName} does not exist in the mock class`);
            }
            decorator(this.constructorRef.prototype, propertyName as string, Object.getOwnPropertyDescriptor(this.constructorRef.prototype, propertyName));
            return spy;
        };
    }

    createParamDecoratorCall(): ParamDecoratorCall {
        return (decorator: ParameterDecorator, index: number) => {
            decorator(this.constructorRef, undefined, index);
        };
    }

    createPropertyDecoratorCall<Key extends keyof T>(): PropDecoratorCall<T> {
        return (decorator: PropertyDecorator, propertyName: Key, spy?: jasmine.Spy<ReflectionGetMetadata>) => {
            if (!this.propertyDefintions.find(p => p.name === propertyName)) {
                throw new Error(`Could not apply the property decorator becuase the property ${propertyName} does not exist in the mock class`);
            }
            spy = (spy || spyOn(Reflect, 'getMetadata')).and.callFake((key: string, target: any, propKey) => {
                if (key === 'design:type') {
                    return this.propertyDefintions.find(p => p.name === propertyName).designType;
                }
                return this.getMetadata(key, target);
            });
            decorator(this.constructorRef.prototype, propertyName as string);
            return spy;
        };
    }

    createClassDecoratorCall(): ClassDecoratorCall {
        return (decorator: ClassDecorator, spy?: jasmine.Spy<any>) => {
            spy = (spy || spyOn(Reflect, 'getMetadata')).and.callFake((key: string, target: any, propKey?) => {
                if (key === 'design:paramtypes') {
                    return this.constructorParams.map(p => p.designType);
                }
                return this.getMetadata(key, target, propKey);
            });
            decorator(this.constructorRef);
            return spy;
        };
    }

    createInstance(fn?: (thisValue: T, ...args: any[]) => T, ...args: any[]) {
        const instance = new this.constructorRef();
        this.propertyDefintions.forEach(p => {
            Object.defineProperty(instance, p.name, {
                value: p.defaultValue,
                writable: true
            });
        });
        this.functionDefinitions.forEach(f => {
            Object.defineProperty(instance, f.name, {
                value: f.fn,
                writable: true
            });
        });
        if (fn) {
            fn(instance, ...args);
        }
        return instance;
    }

    modifyConstructorParam(index: number, designTypeOrProvider: Type<any> | MockProvider, designType?: Type<any>) {
        if (index > this.constructorParams.length - 1) {
            throw new Error(`Can't modify constructor parameter at index '${index}' becuase it does not exist`);
        }
        if (designTypeOrProvider instanceof Function) {
            this.constructorParams[index] = { index, designType: designTypeOrProvider };
        } else {
            this.constructorParams[index] = { index, provider: designTypeOrProvider, designType };
        }
        return this;
    }

    removeConstructorParam(index: number) {
        if (index > this.constructorParams.length - 1) {
            throw new Error(`Can't remove constructor parameters at index '${index}' becuase it does not exist`);
        }
        this.constructorParams.splice(index, 1);
        this.constructorParams.forEach((p, i) => p.index = i);
        return this;
    }

    addConstructorParam(designTypeOrProvider: Type<any> | MockProvider, designType?: Type<any>) {
        this.constructorParams.push({
            index: this.constructorParams.length,
            provider: designTypeOrProvider instanceof Function ? undefined : designTypeOrProvider,
            designType: designTypeOrProvider instanceof Function ? designTypeOrProvider
                : (designTypeOrProvider instanceof MockClass ? designTypeOrProvider.constructorRef : designType),
        });
        return this;
    }

    addFunction<K extends keyof T>(name: K, fn: (...args: any) => any, returnType?: Type<any>) {
        if ([...this.functionDefinitions, ...this.propertyDefintions].find(p => p.name === name)) {
            throw new Error(`Can't add function => function or property already exists with the name '${name}'`);
        }
        this.functionDefinitions.push({ name: name as string, fn, returnType });
        return this;
    }

    removeFunction<K extends keyof T>(name: K) {
        const fn = this.functionDefinitions.find(p => p.name === name);
        if (fn) {
            this.functionDefinitions.slice(this.functionDefinitions.indexOf(fn), 1);
        } else {
            throw new Error(`Can't remove function => No properties exist with the name '${name}'`);
        }
        return this;
    }

    modifyFunction<K extends keyof T>(name: K, fn: (...args: any) => any, returnType?: Type<any>) {
        const existing = this.functionDefinitions.find(p => p.name === name);
        if (existing) {
            this.functionDefinitions[this.functionDefinitions.indexOf(existing)] = { name: name as string, fn, returnType };
        } else {
            throw new Error(`Can't remove function => No properties exist with the name '${name}'`);
        }
        return this;
    }

    modifyProperty<K extends keyof T>(name: K, designType?: Type<any>, defaultValue?: any) {
        const prop = this.propertyDefintions.find(p => p.name === name);
        if (prop) {
            this.propertyDefintions[this.propertyDefintions.indexOf(prop)] = { name: name as string, designType, defaultValue };
        } else {
            throw new Error(`Can't modify property => No properties exist with the name '${name}'`);
        }
        return this;
    }

    addProperty<K extends keyof T>(name: K, designType?: Type<any>, defaultValue?: any) {
        if ([...this.functionDefinitions, ...this.propertyDefintions].find(p => p.name === name)) {
            throw new Error(`Can't add property => A property or function already exists with the name '${name}'`);
        }
        this.propertyDefintions.push({ name: name as string, designType, defaultValue });
        return this;
    }

    removeProperty<K extends keyof T>(name: K) {
        const prop = this.propertyDefintions.find(p => p.name === name);
        if (prop) {
            this.propertyDefintions.slice(this.propertyDefintions.indexOf(prop), 1);
        } else {
            throw new Error(`Can't remove a property => No properties exist with the name '${name}'`);
        }
        return this;
    }
}
