import { dasherize, asyncForEach, asyncMap, removeDuplicates, getDuplicates, validateUniqueValues, isConstructor, arrayValue } from '../../src/internal/common/utils';

describe('Utils[functions]', () => {

    describe('dasherize()', () => {
        it('Should add a dash before capital letters and change to lower-case', () => {
            expect(dasherize('heyThere')).toEqual('hey-there');
        });
        it('Should not add dash before the first letter but still convert it to lower case', () => {
            expect(dasherize('HeyThere')).toEqual('hey-there');
        });
        it('Should not add dash before before capital letters if they are used consquetively', () => {
            expect(dasherize('HEYThere')).toEqual('heythere');
        });
    });

    describe('asyncForEach()', () => {

        const spyObj = {
            fn: async (val: number, index: number) => {
                return new Promise((resolve) => setTimeout(() => resolve(val * 2), 150));
            }
        };

        it('It should iterate through an array and call the async function with each element and index', async () => {
            const spy = spyOn(spyObj, 'fn');
            await asyncForEach([10, 5, 22], spyObj.fn);
            expect(spy).toHaveBeenCalledWith(10, 0);
            expect(spy).toHaveBeenCalledWith(5, 1);
            expect(spy).toHaveBeenCalledWith(22, 2);
        });

    });

    describe('asyncMap()', () => {

        const spyObj = {
            fn: async (val: number, index: number) => {
                return new Promise((resolve) => setTimeout(() => resolve(val * 2), 150));
            }
        };

        it('It should iterate through an array and call the async function with each element and index', async () => {
            const spy = spyOn(spyObj, 'fn');
            await asyncForEach([1, 7, 6], spyObj.fn);
            expect(spy).toHaveBeenCalledWith(1, 0);
            expect(spy).toHaveBeenCalledWith(7, 1);
            expect(spy).toHaveBeenCalledWith(6, 2);
        });

        it('It should return a mapped array, allowing for an asynchronous mapping function', async () => {
            expect(await asyncMap([4, 2, 0, 20], spyObj.fn)).toEqual([8, 4, 0, 40]);
        });

    });

    describe('getDuplicates()', () => {

        const arr = [
            { name: 'John', age: 22 },
            { name: 'John', age: 25 },
            { name: 'Peter', age: 22 },
            { name: 'Peter', age: 15 },
            { name: 'Peter', age: 12 },
            { name: 'Susan', age: 5 }
        ];

        it('Should return an array of duplicates', () => {
            expect(getDuplicates(arr, p => p.name).length).toEqual(2);
        });

        it('Duplicates should be returned as an array of underlying elements', () => {
            expect(getDuplicates(arr, p => p.age)[0][0]).toEqual(arr[0]);
            expect(getDuplicates(arr, p => p.age)[0][1]).toEqual(arr[2]);
        });

        it('Should return an empty array where no duplicates are found', () => {
            expect(getDuplicates(arr, p => p).length).toEqual(0);
        });

    });

    describe('removeDuplicates()', () => {

        const arr = [
            { name: 'John', age: 22 },
            { name: 'John', age: 25 },
            { name: 'Peter', age: 22 },
            { name: 'Peter', age: 15 },
            { name: 'Peter', age: 12 },
            { name: 'Susan', age: 5 }
        ];

        it('Should return a reduced array where duplicates have been removed', () => {
            expect(removeDuplicates(arr, (p1, p2) => p1.name === p2.name).length).toEqual(3);
            expect(removeDuplicates(arr, (p1, p2) => p1.name === p2.name).filter(p => p.name === 'John').length).toEqual(1);
            expect(removeDuplicates(arr, (p1, p2) => p1.name === p2.name).filter(p => p.name === 'Peter').length).toEqual(1);
            expect(removeDuplicates(arr, (p1, p2) => p1.name === p2.name).filter(p => p.name === 'Susan').length).toEqual(1);
        });

    });

    describe('validateUniqueValues()', () => {

        const arr = [
            { name: 'John', age: 22 },
            { name: 'John', age: 25 },
            { name: 'Peter', age: 13 },
            { name: 'Susan', age: 5 }
        ];

        it('Should throw and error when duplicates are found', () => {
            expect(() => validateUniqueValues(arr, p => p.name, () => '')).toThrowError();
        });

        it('The thrown error message should be derived taken from the error message callback', () => {
            expect(() => validateUniqueValues(arr, p => p.name, (name) => `${name} is duplicated`)).toThrow(new Error('John is duplicated'));
        });

        it('Should not throw and error where no duplicates are found', () => {
            expect(() => validateUniqueValues(arr, p => p.age, () => '')).not.toThrowError();
        });

    });

    describe('isContructor()', () => {

        it('Should return true for a class contructor', () => {
            class MyClass { }
            expect(isConstructor(MyClass)).toEqual(true);
        });

        it('Should return false for normal functions', () => {
            expect(isConstructor(() => { })).toEqual(false);
        });

        it('Should return false for null/undefined values', () => {
            expect(isConstructor(null)).toEqual(false);
            expect(isConstructor(undefined)).toEqual(false);
        });

        it('Should return false for objects and primitive values', () => {
            expect(isConstructor({ name: 'some name' })).toEqual(false);
            expect(isConstructor('asdasd')).toEqual(false);
        });

    });

    describe('arrayValue()', () => {

        it('Should wrap a non-array argument as an array', () => {
            expect(arrayValue(10)).toEqual([10]);
        });

        it('Should leave an array argument unchanged ', () => {
            expect(arrayValue([5, 2])).toEqual([5, 2]);
        });

    });

});
