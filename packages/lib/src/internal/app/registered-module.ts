import { Type } from '../common/cli-types';
import { ModuleRef } from '../module/module-ref';

/**
 * Represents a module that has been registered in the global components registry
 */
export interface RegisteredModule {

    /**
     * Constructor of the module
     */
    constructorRef: Type<any>;

    /**
     * The instantiated module reference
     */
    moduleRef: ModuleRef;

    /**
     * Whether the module was registered as a configured module
     */
    configured: boolean;

}
