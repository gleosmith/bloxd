import { ValueProviderRef } from '../../../src/internal/dependency-injection/provider-refs/value-provider-ref';
import { ProviderToken, ValueProvider } from '../../../src/internal/dependency-injection/providers';
import { MockProvider } from './mock-provider';

export class MockValueProvider implements MockProvider {

    private _token: ProviderToken;
    private _value: any;

    private _singleton: boolean;
    private _global = false;

    constructor(token: ProviderToken, value: any) {
        this._token = token;
        this._value = value;
        this._singleton = true;
    }

    get provider(): ValueProvider {
        return { provide: this._token, singleton: this._singleton, useValue: this._value, global: this._global };
    }

    get token() {
        return this._token;
    }

    get value() {
        return this._value;
    }

    setSingleton(val: boolean) {
        this._singleton = val;
        return this;
    }

    setGlobal(global: boolean) {
        this._global = global;
        return this;
    }

    updateToken(token: ProviderToken) {
        this._token = token;
        return this;
    }

    updateValue(value: any) {
        this._token = value;
        return this;
    }

    providerRef() {
        return new ValueProviderRef(this._token, this.value, this._singleton);
    }

}
