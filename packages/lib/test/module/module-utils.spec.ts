import { ConfiguredModule } from '../../src';
import { ModuleUtils } from '../../src/internal/module/module-utils';

describe('ModuleUtils[class]', () => {

    class Module1 { }
    class Module2 { }

    const configured: ConfiguredModule = {
        module: Module1
    };

    describe('constructorRef()[static]', () => {

        it('Should return the module when it is a configured module', () => {
            expect(ModuleUtils.constructorRef(configured)).toBe(Module1);
        });

        it('Should return the class when it is a constructor', () => {
            expect(ModuleUtils.constructorRef(Module2)).toBe(Module2);
        });

    });

    describe('equal()[static]', () => {

        it('Should be true when the constructors are the same', () => {
            expect(ModuleUtils.equal(Module1, configured)).toBe(true);
            expect(ModuleUtils.equal(configured, Module1)).toBe(true);
            expect(ModuleUtils.equal(Module2, Module2)).toBe(true);
        });

        it('Should be false when the constructors aren\'t the same', () => {
            expect(ModuleUtils.equal(Module2, configured)).toBe(false);
            expect(ModuleUtils.equal(configured, Module2)).toBe(false);
            expect(ModuleUtils.equal(Module1, Module2)).toBe(false);
        });

    });

});
