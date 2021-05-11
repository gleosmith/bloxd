import { MockCommand, MockOptions, MockModule } from '../shared';
import { CommandRef } from '../../src/internal/command/command-ref';
import { OptionsLink } from '../../src/internal/options/options-link';
import { Injector } from '../../src/internal/dependency-injection/injector';

interface MockCommandModel {
    dirPath: string;
    sourceFolder: string;
    execute: () => void;
}


describe('CommandRef[class]', () => {

    let command: MockCommand<MockCommandModel>;
    let ref: CommandRef<MockCommandModel>;

    beforeEach(() => {
        command = new MockCommand<MockCommandModel>()
            .setName('test')
            .setParent(new MockModule().createModuleRef())
            .addParameter('dirPath', { designType: String }, './')
            .addParameter('sourceFolder', { designType: String }, './../')
            .addFunction('execute', () => { });

    });

    describe('constructor()', () => {

        it('Should set the constructor and source module that were provided in the constructor call', () => {
            ref = command.commandRef();
            expect(ref.constructorRef).toBe(command.constructorRef);
        });

        it('Should throw an error if an undecorated command is provided', () => {
            command.removeMetadata();
            expect(() => new CommandRef(command.constructorRef, [], null, command.mockRegistry.registry)).toThrowError();
        });

        it('Should read the parameter metadata from the constructor', () => {
            ref = command.commandRef();
            expect(ref.parameters).toEqual(command.parameterMetadata);
        });

        it('Should register all the options with the global registry, providing the option constructor and the command parent module', () => {

            command
                .addOptions(new MockOptions())
                .addOptions(new MockOptions());
            const optionLink = { constructorRef: command.getOptions(0).constructorRef, moduleRef: command.mockModule.moduleRef, providerRef: null };
            const spy = command.mockRegistry.optionsSpy()(optionLink);
            ref = command.applyMetadata().commandRef();

            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy.calls.argsFor(0)[0]).toBe(command.getOptions(0).constructorRef);
            expect(spy.calls.argsFor(0)[1]).toBe(command.mockModule.moduleRef);
            expect(spy.calls.argsFor(1)[0]).toBe(command.getOptions(1).constructorRef);
            expect(spy.calls.argsFor(1)[1]).toBe(command.mockModule.moduleRef);
            expect(ref.options).toEqual([optionLink, optionLink]);
        });

        it('Should throw if the same options are provided more than once', () => {
            const opts = new MockOptions();
            command.addOptions(opts).addOptions(opts);
            expect(() => ref = command.commandRef()).toThrowError();
        });

        it('Should throw an error if any options do not have metadata', () => {
            command
                .addOptions(new MockOptions())
                .addOptions(new MockOptions())
                .applyMetadata()
                .getOptions(0)
                .removeMetadata();
            expect(() => ref = command.commandRef()).toThrowError();
        });

    });

    describe('resolveWithParameters()', () => {

        let instance: MockCommandModel;
        let optsLink: OptionsLink;

        beforeEach(() => {
            command
                .removeMetadata()
                .addOptions(new MockOptions().applyMetadata())
                .applyMetadata();
            ref = command.commandRef();
            optsLink = { constructorRef: command.getOptions(0).constructorRef, moduleRef: command.mockModule.moduleRef, providerRef: null };

            command.mockRegistry.optionsSpy()(optsLink);

            instance = command
                .modifyProperty('dirPath', String, 'defaultvalue')
                .addParsedParam('dirPath', '100')
                .addParsedParam('sourceFolder', 200)
                .createInstance();
        });

        it('Should call the super class injector when called for the first time', async () => {
            const spy = spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.resolveWithParameters(command.parsedParameters);
            expect(spy).toHaveBeenCalled();
        });

        it('Should not call the super class injector when called for the second time', async () => {
            const spy = spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.resolveWithParameters(command.parsedParameters);
            await ref.resolveWithParameters(command.parsedParameters);
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('Should wait for super injector and return the result of the injector', async () => {
            const spy = spyOn(Injector.prototype, 'resolve').and.callFake(() => new Promise(resolve =>
                setTimeout(() => resolve(instance as any), 2000))
            );
            const result = await ref.resolveWithParameters(command.parsedParameters);
            expect(result).toEqual(instance);
        });

        it('Should set the property of the component instance, defined by the property value, to the parsed value', async () => {
            const spy = spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.resolveWithParameters(command.parsedParameters);
            expect(instance.dirPath).toBe('100');
            expect(instance.sourceFolder).toBe(200 as any);
        });

        it('Should retain the property\'s original value where no parsed parameter exists', async () => {
            const spy = spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.resolveWithParameters(command.removeParsedParam('dirPath').parsedParameters);
            expect(instance.dirPath).toBe('defaultvalue');
        });

        it('Should retain the property\'s original value where parsed parameters value is undefined', async () => {
            const spy = spyOn(Injector.prototype, 'resolve').and.resolveTo(instance);
            await ref.resolveWithParameters(command.modifyParsedParam('dirPath', undefined).parsedParameters);
            expect(instance.dirPath).toBe('defaultvalue');
        });

    });


});
