import { CLI_NAME, CLI_VERSION } from './../../../src/internal/app/app-context';
import { ValueProviderRef } from './../../../src/internal/dependency-injection/provider-refs/value-provider-ref';
import { GlobalComponentsRegistry } from '../../../src/internal/app/global-components-registry';
import { OptionsLink } from '../../../src/internal/options/options-link';
import { Type } from '../../../src/internal/common/cli-types';
import { ModuleRef } from '../../../src/internal/module/module-ref';
import { MockProvider } from '../di/mock-provider';

export type RegisterOptionsSpy = jasmine.Spy<(constructorRef: Type<any>, moduleRef: ModuleRef) => OptionsLink>;

export class MockRegistery {

    private _registry: GlobalComponentsRegistry;
    private _mockProvider: MockProvider;

    constructor() {
        this._registry = new GlobalComponentsRegistry();
    }

    get registry() {
        return this._registry;
    }

    addProvider(provider: MockProvider) {
        this._registry.providers.push(provider.providerRef());
        return this;
    }

    optionsSpy(): (val: OptionsLink) => RegisterOptionsSpy {
        return (returnValue: OptionsLink) => {
            return spyOn(this._registry, 'registerOptions').and.returnValue(returnValue);
        };
    }

    globalProvidersSpy() {
        return() => spyOn(this._registry, 'registerProvider');
    }


}