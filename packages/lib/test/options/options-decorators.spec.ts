import * as di from '../../src/internal/dependency-injection/injectable-arg-definition';
import { MetadataKey, getMetadata } from '../../src/internal/common/meta-data';
import { MockOptions, getOptionMetadata, ClassDecoratorCall, PropDecoratorCall } from '../shared';


interface MockOptionsModel {
    filePath: string;
    version: Number;
}




let options: MockOptions<MockOptionsModel>;
let applyClassDecorator: ClassDecoratorCall;
let applyOptionDecorator: PropDecoratorCall<MockOptionsModel>;
beforeEach(() => {
    options = new MockOptions<MockOptionsModel>()
        .addOption('filePath', { designType: String }, './')
        .addOption('version', { designType: Number }, './');
    applyClassDecorator = options.createClassDecoratorCall();
    applyOptionDecorator = options.createPropertyDecoratorCall();
});

describe('@CliOptions()[decorator]', () => {

    it('Should register the constructor for dependency injection', () => {
        const spy = spyOn(di, 'registerInjectablesArgs');
        applyClassDecorator(options.classDecorator());
        expect(spy).toHaveBeenCalledWith(options.constructorRef);
    });

    it('Should set the CliOptions metadata to true', () => {
        applyClassDecorator(options.classDecorator());
        expect(!!getMetadata(MetadataKey.Options, options.constructorRef)).toBe(true);
    });

});

describe('@CliOption()[decorator]', () => {

    it('Should read property name and design type metadata', () => {
        applyOptionDecorator(options.optionDecorator('filePath'), 'filePath');
        expect(getOptionMetadata(options.constructorRef, 'filePath')?.designType)
            .toBe(options.getOptionMetadata('filePath').designType);

        expect(getOptionMetadata(options.constructorRef, 'filePath')?.propertyName)
            .toBe('filePath');
    });

    it('Should set name to the dasherized property name when the name option is ommitted', () => {
        applyOptionDecorator(options.optionDecorator('filePath'), 'filePath');
        expect(getOptionMetadata(options.constructorRef, 'filePath').name)
            .toBe(options.getOptionMetadata('filePath').name);
    });

    it('Should set name to the name option', () => {
        applyOptionDecorator(options.modifyOption('filePath', { name: 'file' }).optionDecorator('filePath'), 'filePath');
        expect(getOptionMetadata(options.constructorRef, 'filePath').name)
            .toBe('file');
    });

    it('Should set default metadata when no options are provided', () => {
        applyOptionDecorator(options.optionDecorator('filePath'), 'filePath');
        expect(getOptionMetadata(options.constructorRef, 'filePath').alias).toBe(undefined);
        expect(getOptionMetadata(options.constructorRef, 'filePath').description).toBe(undefined);
        expect(getOptionMetadata(options.constructorRef, 'filePath').data).toBe(undefined);
        expect(getOptionMetadata(options.constructorRef, 'filePath').typeChecks).toBe(undefined);
        expect(getOptionMetadata(options.constructorRef, 'filePath').required).toBe(false);
    });

    it('Should set the the metadata from the provided options', () => {
        applyOptionDecorator(
            options.modifyOption('version', {
                alias: 's',
                description: 'a description',
                data: 12,
                typeChecks: false,
                required: true
            }).optionDecorator('version')
            , 'version'
        );
        expect(getOptionMetadata(options.constructorRef, 'version').alias).toBe('s');
        expect(getOptionMetadata(options.constructorRef, 'version').description).toBe('a description');
        expect(getOptionMetadata(options.constructorRef, 'version').data).toBe(12);
        expect(getOptionMetadata(options.constructorRef, 'version').typeChecks).toBe(false);
        expect(getOptionMetadata(options.constructorRef, 'version').required).toBe(true);
    });

});
