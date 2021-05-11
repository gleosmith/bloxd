import { MockOptions } from './../shared/options/options';
import { CommandRef } from './../../src/internal/command/command-ref';
import { MockCommand } from './../shared/commands/commands';
import { ProviderRef } from './../../src/internal/dependency-injection/provider-refs/provider-ref';
import { MockClassProvider } from './../shared/di/class-providers';
import { MockModule } from './../shared/module/mock-module';
import { GlobalComponentsRegistry } from './../../src/internal/app/global-components-registry';
import { Command } from '../../src';
import { OptionsProviderRef } from '../../src/internal/options/option-provider-ref';
import { MockRegistery, MockModuleBuilder } from '../shared';

describe('GlobalComponentsRegistry', () => {

    let registry: GlobalComponentsRegistry;
    let module1: MockModule;
    let module2: MockModule;
    beforeEach(() => {
        registry = new GlobalComponentsRegistry();
        module1 = new MockModule()
            .addProvider(new MockClassProvider())
            .applyMetadata();
        module2 = new MockModule().applyMetadata();
    });

    describe('registerCommandModule', () => {

        it('Should throw an error if that module has already been used as a shared module', () => {
            registry.registerSharedModule(module1.constructorRef);
            expect(() => registry.registerCommandModule(module1.constructorRef, null)).toThrowError();
        });

        it('Should throw an error if that module has already been used as a command module', () => {
            registry.registerCommandModule(module2.constructorRef, null);
            expect(() => registry.registerCommandModule(module2.constructorRef, null)).toThrowError();
        });

        it('Should register the module an return the module reference when valid', () => {
            const result = registry.registerCommandModule(module1.constructorRef, null);
            expect(result.constructorRef).toEqual(module1.constructorRef);
        });

    });

    describe('registerSharedModule()', () => {

        it('Should throw an error if that module has already been used as a command module', () => {
            registry.registerCommandModule(module2.constructorRef, null);
            expect(() => registry.registerSharedModule(module2.constructorRef)).toThrowError();
        });

        it('Should return an existing module reference where the same module is registered more than once', () => {
            const result = registry.registerSharedModule(module1.constructorRef);
            expect(registry.registerSharedModule(module1.constructorRef)).toBe(result);
        });

        it('Should return an new module reference where the same module is registered more than once but as a configured module', () => {
            const result = registry.registerSharedModule(module2.configuredModule({}));
            expect(registry.registerSharedModule(module2.constructorRef)).not.toBe(result);
        });

    });

    describe('registerProvider()', () => {

        let providerRef: MockClassProvider;
        beforeEach(() => {
            providerRef = new MockClassProvider();
        });

        it('Should throw an error if provider with the same token is registered more than once', () => {
            registry.registerProvider(providerRef.updateToken('1').providerRef())
            expect(() => registry.registerProvider(providerRef.updateToken('1').providerRef())).toThrowError();
        });

        it('Should not throw an error if there are no duplicates', () => {
            registry.registerProvider(providerRef.updateToken('1').providerRef())
            expect(() => registry.registerProvider(providerRef.updateToken('2').providerRef())).not.toThrowError();
        });

    });

    describe('registerCommand()', () => {

        let command: MockCommand<Command>;
        beforeEach(() => {
            command = new MockCommand().applyMetadata();
        });

        it('Should throw an error if the command has already been registered', () => {
            registry.registerCommand(command.constructorRef, null);
            expect(() => registry.registerCommand(command.constructorRef, null)).toThrowError();
        });

        it('Should return a command reference', () => {
            const result = registry.registerCommand(command.constructorRef, null);
            expect(result instanceof CommandRef).toBeTrue();
            expect(result.constructorRef).toBe(command.constructorRef);
        });

    });

    describe('registerOptions', () => {

        let opts: MockOptions;
        beforeEach(() => {
            opts = new MockOptions().addOption('name', { name: 'name2' }).applyMetadata();
        });

        it('Should return an option links', () => {
            const moduleRef = new MockModule().createModuleRef().moduleRef;
            const result = registry.registerOptions(opts.constructorRef, moduleRef);
            expect(result.moduleRef).toBe(moduleRef);
            expect(result.constructorRef).toBe(opts.constructorRef);
        });

        it('Should the same link where the same class is provided more than once', () => {
            const moduleRef = new MockModule().createModuleRef().moduleRef;
            const result = registry.registerOptions(opts.constructorRef, moduleRef);
            expect(registry.registerOptions(opts.constructorRef, moduleRef)).toBe(result);
        });

    });

    describe('resolveOptions', () => {

        let builder: MockModuleBuilder;
        let opts1: MockOptions;
        let opts2: MockOptions;

        beforeEach(() => {
            opts1 = new MockOptions();
            opts2 = new MockOptions();
            builder = new MockModuleBuilder()
                .addModule(new MockModule())
                .addModule(new MockModule())
                .addModule(new MockModule())
                .addModule(new MockModule())
                .addModule(new MockModule())
                .addModule(new MockModule())
                .addModule(new MockModule())
                .addModule(new MockModule())


            builder.from(builder.getModule(0))
                .addRoute(builder.getModule(1), {path: 'a'})
                .addRouteAndSelect(builder.getModule(2), { path: 'b' })
                .addRoute(builder.getModule(6), { path: 'c' })
                .addRouteAndSelect(builder.getModule(3), { path: 'd' })
                .addRouteAndSelect(builder.getModule(4), { path: 'e' })
                .addRouteAndSelect(builder.getModule(5), { path: 'f' })
                .addRoute(builder.getModule(7), { path: 'g' });


        });

        it('The set the parent module of the options provider ref to parent module of the options when only one option is provided', () => {
            builder.build();
            const link1 = registry.registerOptions(opts1.constructorRef, builder.getModule(5).moduleRef);
            const link2 = registry.registerOptions(opts2.constructorRef, builder.getModule(1).moduleRef);
            registry.resolveOptions();
            expect(link1.providerRef.parent).toBe(builder.getModule(5).moduleRef);
            expect(link2.providerRef.parent).toBe(builder.getModule(1).moduleRef);

        });

        it('Should set the parent module of the options provider ref lowest common parent injector', () => {
            builder.build();
            const link1 = registry.registerOptions(opts1.constructorRef, builder.getModule(1).moduleRef);
            const link2 = registry.registerOptions(opts1.constructorRef, builder.getModule(2).moduleRef);
            const link3 = registry.registerOptions(opts2.constructorRef, builder.getModule(6).moduleRef);
            const link4 = registry.registerOptions(opts2.constructorRef, builder.getModule(7).moduleRef);
            registry.resolveOptions();
            expect(link2.providerRef.parent.constructorRef).toBe(builder.getModule(0).moduleRef.constructorRef);
            expect(link1.providerRef.parent.constructorRef).toBe(builder.getModule(0).moduleRef.constructorRef);
            expect(link3.providerRef.parent.constructorRef).toBe(builder.getModule(2).moduleRef.constructorRef);
            expect(link4.providerRef.parent.constructorRef).toBe(builder.getModule(2).moduleRef.constructorRef);
        });

        it('Should throw an error if the the same option reference does not share a common injector', () => {
            builder.build();
            const link1 = registry.registerOptions(opts1.constructorRef, new MockModule().createModuleRef().moduleRef);
            const link2 = registry.registerOptions(opts1.constructorRef, builder.getModule(3).moduleRef);
            expect(() => registry.resolveOptions()).toThrowError();
        });

    });


});
