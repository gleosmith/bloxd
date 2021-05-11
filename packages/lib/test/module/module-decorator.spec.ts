import { CliModule } from '../../src';
import { Type } from '../../src/internal/common/cli-types';
import { MockClass } from '../shared';
import { getMetadata, MetadataKey } from '../../src/internal/common/meta-data';
import { ModuleDefinition } from '../../src/internal/module/module-models';

describe('@CliModule()[decorator]', () => {

    let classes: Type<any>[];
    beforeEach(() => {
        classes = [
            new MockClass().constructorRef,
            new MockClass().constructorRef,
            new MockClass().constructorRef,
            new MockClass().constructorRef,
            new MockClass().constructorRef,
            new MockClass().constructorRef,
            new MockClass().constructorRef,
            new MockClass().constructorRef,
        ];
    });

    it('Should attach the specified metadata to the constructor', () => {
        @CliModule({
            commands: [classes[0], classes[1]],
            imports: [classes[2]],
            exports: [classes[3], classes[4]],
            providers: [classes[5]],
            options: [classes[6], classes[7]]
        })
        class MockModule { }
        expect(getMetadata<ModuleDefinition>(MetadataKey.Module, MockModule)).toEqual({
            commands: [classes[0], classes[1]],
            imports: [classes[2]],
            exports: [classes[3], classes[4]],
            providers: [classes[5]],
            options: [classes[6], classes[7]]
        });
    });

    it('Should set empty arrays when no metadata is provided', () => {
        @CliModule({})
        class MockModule { }
        expect(getMetadata<ModuleDefinition>(MetadataKey.Module, MockModule)).toEqual({
            commands: [],
            imports: [],
            exports: [],
            providers: [],
            options: []
        });
    });

    it('Should turn options into an array when provided as a single class', () => {
        @CliModule({
            options: classes[0]
        })
        class MockModule { }
        expect(getMetadata<ModuleDefinition>(MetadataKey.Module, MockModule).options).toEqual([classes[0]]);
    });

});
