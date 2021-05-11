import { Type } from '../common/cli-types';
import { ConfiguredModule } from './module-models';
import { isConstructor } from '../common/utils';
import { Provider } from '../dependency-injection/providers';
import { CommandRoute } from '../command/command-routes';
import { hasMetadata, MetadataKey } from '../common/meta-data';
import { RouteUtils } from '../command/route-utils';

/**
 * A set of utility functions that assist working with modules and configured modules
 */
export class ModuleUtils {

    /**
     * Determines if two modules equal by comparing their constructors
     * @param module1 Module or configured module
     * @param module2 Module or configured module
     */
    static equal(module1: Type<any> | ConfiguredModule, module2: Type<any> | ConfiguredModule): boolean {
        return ModuleUtils.constructorRef(module1) === ModuleUtils.constructorRef(module2);
    }

    static isModule(item: Type<any> | ConfiguredModule | Provider | CommandRoute): boolean {
        if (isConstructor(item)) {
            return hasMetadata(MetadataKey.Module, item as Type<any>)
        } else {
            if (!RouteUtils.isRoute(item)) {
                if (item.hasOwnProperty('module')) {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * Returns the class constructor of a module or a configured module
     * @param mod Module or configured module
     */
    static constructorRef(mod: Type<any> | ConfiguredModule): Type<any> {
        if (isConstructor(mod)) {
            return mod as Type<any>;
        } else {
            if (mod) {
                return (mod as ConfiguredModule).module;
            }
            return undefined;
        }
    }

}
