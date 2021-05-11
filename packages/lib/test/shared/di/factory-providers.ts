import { FactoryProviderRef } from '../../../src/internal/dependency-injection/provider-refs/factory-provider-ref';
import { FactoryProvider, ProviderToken } from '../../../src/internal/dependency-injection/providers';
import { MockProvider } from './mock-provider';


export class MockFactoryProvider<T = any> implements MockProvider {


    /**
     * Returns an async function that resolves with the result of 200ms
     * @param result Result to resolve
     */
    static factoryFn1(result: any) {
        return async () => new Promise(r => setTimeout(() => r(result), 200));
    }

    /**
    * Returns a sync function that return the result
    * @param result Result to resolve
    */
    static factoryFn2(result: any) {
        return () => result;
    }

    private _token: ProviderToken;
    private _singleton: boolean;
    private _factoryFn: () => any | Promise<any>;
    private _global = false;

    constructor(token: ProviderToken, fn: (...args) => any) {
        this._token = token;
        this._factoryFn = fn;
        this._singleton = true;
    }

    setSingleton(val: boolean) {
        this._singleton = val;
        return this;
    }
    setGlobal(global: boolean) {
        this._global = global;
        return this;
    }

    get factoryFn(): () => any {
        return this._factoryFn;
    }

    get token() {
        return this._token;
    }

    get provider(): FactoryProvider {
        return { provide: this._token, singleton: this._singleton, useFactory: this._factoryFn, global: this._global };
    }

    updateToken(token: ProviderToken) {
        this._token = token;
        return this;
    }

    updateFactory(fn: () => any) {
        this._factoryFn = fn;
        return this;
    }

    execute(): any | Promise<any> {
        return this._factoryFn();
    }

    providerRef(): FactoryProviderRef {
        return new FactoryProviderRef(this._token, this._factoryFn, this._singleton);
    }

}
