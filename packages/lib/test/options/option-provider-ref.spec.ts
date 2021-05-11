import { OptionsProviderRef } from '../../src/internal/options/option-provider-ref';
import { ModuleRef } from '../../src/internal/module/module-ref';
import { MockOptions, MockModule, asyncThrowsError } from '../shared';
import { AfterOptionsInit } from '../../src';
import { Injector } from '../../src/internal/dependency-injection/injector';


interface MockOptionsModel extends AfterOptionsInit {
    filePath: string;
    version: Number;
    afterOptionsInit: () => Promise<any>;
}


describe('OptionProviderRef[class]', () => {

    let ref: OptionsProviderRef;
    let moduleRef: ModuleRef;
    let options: MockOptions<MockOptionsModel>;
    beforeEach(() => {
        moduleRef = MockModule.simpleModuleWithProviders().createModuleRef().moduleRef;
        options = new MockOptions()
            .addOption('filePath', { designType: String }, './')
            .addOption('version', { designType: Number }, 100)
            .addFunction('afterOptionsInit', () => {});

    });

    describe('constructor()', () => {

        it('Should set the injectToken to the constructor', () => {
            ref = options.optionsProviderRef();
            expect(ref.injectToken).toEqual(options.constructorRef);
        });

    });

    describe('init()', () => {

        it('Should call the super injector', async () => {
            const instance = options.createInstance();
            const spy = spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            ref = options.optionsProviderRef();
            await ref.init([]);
            expect(spy).toHaveBeenCalled();
        });

        it('Should bind the parsed options to the instance returned by the injector', async () => {

            const instance = options
                .addParsedOption('filePath', './new-path')
                .addParsedOption('version', 5)
                .createInstance();
            spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            ref = options.optionsProviderRef();
            await ref.init(options.parsedOptions);
            expect(instance.filePath).toBe('./new-path');
            expect(instance.version).toBe(5);
        });

        it('When binding, it should retain the default value where no parsed option exists', async () => {

            const instance = options
                .addParsedOption('filePath', './new-path')
                .createInstance();
            const originalValue = instance.version;

            ref = options
                .removeParsedOption('filePath')
                .optionsProviderRef();

            spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.init(options.parsedOptions);
            expect(instance.version).toBe(originalValue);
        });

        it('When binding, it should retain the default value where the parsed option\'s value is undefined', async () => {

            const instance = options
                .addParsedOption('filePath', undefined)
                .createInstance();
            const originalValue = instance.version;

            ref = options
                .modifyParsedOption('filePath', undefined)
                .optionsProviderRef();

            spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.init(options.parsedOptions);
            expect(instance.version).toBe(originalValue);
        });

        it('Should call the afterOptionsInit hook if it has been implemented', async () => {
            const instance = options.createInstance();
            const spy = spyOn(instance, 'afterOptionsInit');
            ref = options.optionsProviderRef();
            spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.init(options.parsedOptions);
            expect(spy).toHaveBeenCalled();
        });

        it('Should wait if the after afterOptionsInit hook is async', async () => {
            const instance = options.createInstance();
            spyOn(instance, 'afterOptionsInit').and.callFake(() => new Promise<void>(r =>
                setTimeout(() => {
                    instance.version = 2000;
                    r();
                }, 200)
            ));
            ref = options.optionsProviderRef();
            spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.init(options.parsedOptions);
            expect(instance.version).toBe(2000);
        });

    });

    describe('resolve()', () => {

        it('Should return the instance created by the injector', async () => {
            const instance = options.createInstance();
            ref = options.optionsProviderRef();
            spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.init(options.parsedOptions);
            expect(await ref.resolve()).toBe(instance);
        });

        it('Should throw an error if the init function has not been called', async () => {
            ref = options.optionsProviderRef();
            expect(await asyncThrowsError(async () => await ref.resolve())).toBe(true);
        });

    });

});
