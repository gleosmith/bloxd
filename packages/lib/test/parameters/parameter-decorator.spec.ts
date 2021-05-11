
import { getMetadata, MetadataKey } from '../../src/internal/common/meta-data';
import { MockCommand, MockModule, PropDecoratorCall } from '../shared';

interface MockCommandModel {
    dirPath: string;
    sourceFolder: string;
    execute: () => void;
}

describe('@CliParameter()[decorator]', () => {

    let command: MockCommand<MockCommandModel>;
    let applyParamDecorator: PropDecoratorCall<MockCommandModel>;
    beforeEach(() => {
        command = new MockCommand<MockCommandModel>()
            .setName('test')
            .setParent(MockModule.simpleModuleWithProviders())
            .addParameter('dirPath', { designType: String }, './')
            .addParameter('sourceFolder', { designType: String }, './../')
            .addFunction('execute', () => {});
        applyParamDecorator = command.createPropertyDecoratorCall();
    });

    it('Should attach metadata to the class contructor for all decorated properties', () => {
        const spy = applyParamDecorator(command.parameterDecorator('dirPath'), 'dirPath');
        applyParamDecorator(command.parameterDecorator('sourceFolder'), 'sourceFolder', spy);
        expect(getMetadata(MetadataKey.Parameter, command.constructorRef).length).toEqual(2);
    });


    it('Should read the parameter index and designType metadata', () => {
        applyParamDecorator(
            command
                .modifyParameter('dirPath', { index: 5, designType: Number })
                .parameterDecorator('dirPath')
            , 'dirPath'
        );
        const metadata = getMetadata(MetadataKey.Parameter, command.constructorRef);
        expect(metadata[0].index).toBe(5);
        expect(metadata[0].designType).toBe(Number);
    });

    it('Should determine if it is an array design type', () => {
        applyParamDecorator(
            command
                .modifyParameter('dirPath', { index: 5, designType: Array })
                .parameterDecorator('dirPath')
            , 'dirPath'
        );
        const metadata = getMetadata(MetadataKey.Parameter, command.constructorRef);
        expect(metadata[0].isArray).toBe(true);
    });

    it('Should set the name metadata to the dasherized property name when a name has not been provided in the options', () => {
        applyParamDecorator(
            command
                .modifyParameter('sourceFolder', { name: undefined })
                .parameterDecorator('sourceFolder')
            , 'sourceFolder'
        );
        const metadata = getMetadata(MetadataKey.Parameter, command.constructorRef);
        expect(metadata[0].name).toEqual('source-folder');
    });

    it('Should set the name metadata to name provided in the options', () => {
        applyParamDecorator(
            command
                .modifyParameter('sourceFolder', { name: 'folder' })
                .parameterDecorator('sourceFolder')
            , 'sourceFolder'
        );
        const metadata = getMetadata(MetadataKey.Parameter, command.constructorRef);
        expect(metadata[0].name).toEqual('folder');
    });

    it('Should set the default metadata when no options are provided', () => {
        applyParamDecorator(command.parameterDecorator('dirPath'), 'dirPath');
        const metadata = getMetadata(MetadataKey.Parameter, command.constructorRef);
        expect(metadata[0].description).toBe(undefined);
        expect(metadata[0].data).toBe(undefined);
        expect(metadata[0].typeChecks).toBe(undefined);
        expect(metadata[0].optional).toBe(false);
    });

    it('Should set the metadata to the provided options', () => {
        applyParamDecorator(
            command
                .modifyParameter('dirPath', { description: '1', data: [5], optional: true, typeChecks: false })
                .parameterDecorator('dirPath'),
            'dirPath'
        );
        const metadata = getMetadata(MetadataKey.Parameter, command.constructorRef);
        expect(metadata[0].description).toBe('1');
        expect(metadata[0].data).toEqual([5]);
        expect(metadata[0].typeChecks).toBe(false);
        expect(metadata[0].optional).toBe(true);
    });

});
