import { ConstructorProviderRef } from '../../../src/internal/dependency-injection/provider-refs/constructor-provider-ref';
import { Type } from '../../../src/internal/common/cli-types';
import { ProviderToken, ClassProvider } from '../../../src/internal/dependency-injection/providers';
import { MockProvider } from './mock-provider';
import { MockClass } from '../common/mock-class';
import { MockRegistery } from '../app/mock-registry';
import { MockModule } from '../module/mock-module';


export class MockClassProvider<T = any> extends MockClass<T> implements MockProvider {

    private _token: ProviderToken;
    private _registry: MockRegistery;
    private _singleton: boolean;
    private _global = false;
    private _parent: MockModule;

    constructor() {
        super();
        this._token = this.constructorRef;
        this._registry = new MockRegistery();
        this._singleton = true;
    }

    /**
     * The provider's tokens
     */
    get token() {
        return this._token;
    }

    get mockRegistry() {
        return this._registry;
    }

    setParent(mod: MockModule) {
        this._parent = mod;
        return this;
    }

    /**
     * The provider that would be parsed into module metadata. The contructor where the token and class
     * are the same else { provide: TOKEN, useClass: CONSTRUCTOR }
     */
    get provider(): Type<any> | ClassProvider {
        if (this._token instanceof Function) {
            if (this.constructorRef === this._token) {
                if (!this._global && this._singleton) {
                    return this.constructorRef;
                }
                return { provide: this._token, singleton: this._singleton, useClass: this.constructorRef, global: this._global };
            }
        }
        return { provide: this._token, singleton: this._singleton, useClass: this.constructorRef, global: this._global };
    }

    setRegistry(reg: MockRegistery) {
        this._registry = reg;
        return this;
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

    providerRef(): ConstructorProviderRef {
        if (this._parent) {
            if (!this._parent.moduleRef) {
                this._parent.createModuleRef();
            }
        }
        return new ConstructorProviderRef(this._token, this.constructorRef, this._singleton, this._parent?.moduleRef, this._registry.registry.providers);
    }

}
