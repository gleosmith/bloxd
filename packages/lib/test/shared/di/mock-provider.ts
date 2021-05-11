import { ProviderToken, Provider } from '../../../src/internal/dependency-injection/providers';
import { ProviderRef } from '../../../src/internal/dependency-injection/provider-refs/provider-ref';

export interface MockProvider {

    token: ProviderToken;

    providerRef: () => ProviderRef;

    provider: Provider;

    setGlobal: (val: boolean) => MockProvider;

}
