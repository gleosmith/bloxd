import { MetadataKey, getMetadata, setMetadata, pushMetaData, mergeMetaData, hasMetadata } from '../../src/internal/common/meta-data';
import { Type } from '../../src/internal/common/cli-types';

describe('Metadata[functions]', () => {

    let constructor: Type<any>;
    beforeEach(() => {
        class TestClass { }
        constructor = TestClass;
    });

    const metaData = {
        testData: true
    };

    describe('getMetadata()', () => {

        it('Should return constructor metadata for a specified key using reflection', () => {
            Reflect.defineMetadata(MetadataKey.AfterExecute, metaData, constructor);
            expect(getMetadata(MetadataKey.AfterExecute, constructor)).toEqual(metaData);
        });

        it('Should return falsy if no metadata exists', () => {
            expect(getMetadata(MetadataKey.AfterExecute, constructor)).toBeFalsy();
        });

    });

    describe('setMetadata()', () => {

        it('Should set constructor metadata for a specified key using reflection', () => {
            setMetadata(MetadataKey.Command, constructor, metaData);
            expect(Reflect.getMetadata(MetadataKey.Command, constructor)).toEqual(metaData);
        });

    });

    describe('pushMetadata()', () => {

        it('Should create a metadata array (using reflecton) with one element containing the data argument if no metadata exists yet', () => {
            pushMetaData(MetadataKey.InjectableArgs, constructor, metaData);
            expect(Reflect.getMetadata(MetadataKey.InjectableArgs, constructor)).toEqual([metaData]);
        });

        it('Should add an additional item (the data argument) to the metadata array if metadata already exists', () => {
            Reflect.defineMetadata(MetadataKey.InjectableArgs, [1], constructor);
            pushMetaData(MetadataKey.InjectableArgs, constructor, 2);
            expect(Reflect.getMetadata(MetadataKey.InjectableArgs, constructor)).toEqual([1, 2]);
        });

    });

    describe('mergeMetadata()', () => {

        const people = [
            { name: 'peter', age: 12 },
            { name: 'john', age: 15 }
        ];

        it('Should create a metadata array (using reflecton) with one element containing the data argument if no metadata exists yet', () => {
            Reflect.defineMetadata(MetadataKey.InjectableArgs, undefined, constructor);
            mergeMetaData(MetadataKey.InjectableArgs, constructor, p => p.name, people[0]);
            expect(Reflect.getMetadata(MetadataKey.InjectableArgs, constructor)).toEqual([people[0]]);
        });

        it('Should add an additional item to the metadata array if the metadata already exists and the merge condition is not met', () => {
            const newPerson = { name: 'joe', age: 15 };
            Reflect.defineMetadata(MetadataKey.InjectableArgs, people, constructor);
            mergeMetaData(MetadataKey.InjectableArgs, constructor, p => p.name === newPerson.name, newPerson);
            expect(Reflect.getMetadata(MetadataKey.InjectableArgs, constructor)[2]).toEqual(newPerson);
        });

        it('Should merge the data argument with the item in the array that meets the specified condition', () => {
            const newPerson = { name: 'john', age: 10 };
            Reflect.defineMetadata(MetadataKey.InjectableArgs, people, constructor);
            mergeMetaData(MetadataKey.InjectableArgs, constructor, p => p.name === newPerson.name, newPerson);
            expect(Reflect.getMetadata(MetadataKey.InjectableArgs, constructor)[1]).toEqual({ ...people[1], ...newPerson });
        });

    });

    describe('hasMetadata()', () => {

        it('Should return true if metadata (reflection) exists on a constructor', () => {
            Reflect.defineMetadata(MetadataKey.InjectableArgs, metaData, constructor);
            expect(hasMetadata(MetadataKey.InjectableArgs, constructor)).toBeTrue();
        });

        it('Should return false if metadata (reflection) does not exist on a constructor', () => {
            Reflect.defineMetadata(MetadataKey.InjectableArgs, metaData, constructor);
            expect(hasMetadata(MetadataKey.InjectableArgs, constructor)).toBeTrue();
        });

    });

});
