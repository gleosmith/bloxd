import { Type } from '../common/cli-types';
import { OptionsProviderRef } from './option-provider-ref';
import { ModuleRef } from '../module/module-ref';

/**
 * Abstraction layer for references to a options container allowing references to be created before
 * the option containers injection scope is determined
 */
export interface OptionsLink<T = any> {

    /**
     * Constructor of the options container
     */
    constructorRef: Type<T>;

    /**
     * Potential parent injector of the options container
     */
    moduleRef: ModuleRef;

    /**
     * Provider for the options container that is only instantiated at a later stage
     */
    providerRef: OptionsProviderRef<T>;

}
