import { CliBuildError } from "./cli-types";

/**
 * Converts a string into a dashed string by adding a dash before capitalized letters. No dashes are added before
 * capital letters if the capital letters are at the start of the string
 * @example
 * dasherize('MyString') === 'my-string';
 * dasherize('OBBCConnection') === 'odbcconnection';
 * @param text text that will be converted into a dashed string
 */
export function dasherize(text: string) {

    let capitalCaseIndex: number;
    const appliedIndices: number[] = [];

    while (capitalCaseIndex !== -1) {
        capitalCaseIndex = text.search(/([A-Z]{1}).*/g);
        if (capitalCaseIndex !== -1) {

            let seperator = '';
            if (capitalCaseIndex > 0) {
                if (appliedIndices.indexOf(capitalCaseIndex - 1) === -1) {
                    seperator = '-';
                }
            }

            text = text.substring(0, capitalCaseIndex) +
                seperator +
                text.substring(capitalCaseIndex, capitalCaseIndex + 1).toLowerCase() +
                text.substring(capitalCaseIndex + 1, text.length);

            appliedIndices.push(capitalCaseIndex);
        }
    }
    while (text.indexOf(' ') !== -1) {
        text = text.replace(' ', '-');
    }
    while (text.indexOf('--') !== -1) {
        text = text.replace('--', '-');
    }
    if (text.charAt(0) === '-') {
        text = text.replace('-', '');
    }
    return text;
}

/**
 * Executes an async callback function for each element of an array, and returns a new array based on the returned results of the callback
 * @example
 * const newArray = await asyncMap([1,2,4], async (val, index) => await someAsyncLogic(val))
 * @param array source array which will be mapped
 * @param fn async function that takes in the array element and its' index, returning the mapped element
 */
export async function asyncMap<ArrayType, ReturnType>(array: ArrayType[], fn: (item?: ArrayType, index?: number) => Promise<ReturnType>): Promise<ReturnType[]> {
    const mappedList: ReturnType[] = [];
    for (let i = 0; i < array.length; i++) {
        const mappedItem = await fn(array[i], i);
        mappedList.push(mappedItem);
    }
    return mappedList;
}

/**
 * Executes an async callback for each element of an array
 * @example
 * await asyncForEach([1,2,4], async (val, index) => await someAsyncLogic(val))
 * @param array source array which will trigger the function execution for each element
 * @param fn async function that takes in the array element and its' index
 */
export async function asyncForEach<ArrayType>(array: ArrayType[], fn: (item?: ArrayType, index?: number) => Promise<any>): Promise<void> {
    for (let i = 0; i < array.length; i++) {
        await fn(array[i], i);
    }
}

/**
 * Returns an array of duplicates from a given array. Duplicates are returned as an array of the underlying array elements
 * @example
 * const duplicates = getDuplicates([
 *   { name: 'John', age: 12 },
 *   { name: 'John', age: 5 },
 *   { name: 'Susan', age: 10 }
 * ], person => person.name)
 *
 * duplicates === [[{ name: 'John', age: 12 }, { name: 'John', age: 5 }]] // true
 * @param list List which may contain duplicate values
 * @param property Callback function that returns the property value for which to consider duplicates
 */
export function getDuplicates<T>(
    list: T[],
    property: (item: T) => any,
): T[][] {
    const duplicatesModels: T[][] = [];
    list.reduce((prev, curr) => {
        return prev.indexOf(property(curr)) === -1 ? [...prev, property(curr)] : prev;
    }, []).forEach(prop => {
        const duplicates = list.filter(c => property(c) === prop);
        if (duplicates.length > 1) {
            duplicatesModels.push(duplicates);
        }
    });
    return duplicatesModels;
}

/**
 * Returns an array where duplicates have been removed based on a specified condition
 * @example
 * removeDuplicates([
 *   { name: 'John', age: 12 },
 *   { name: 'John', age: 5 },
 *   { name: 'Susan', age: 10}
 * ], (person1, person2) => person1.name === person2.name)
 * @param list  List which may contain duplicates
 * @param condition A callback function that should return a boolean from a comparision between to elements of the array
 */
export function removeDuplicates<T>(
    list: T[],
    condition: (item: T, item2: T) => boolean,
): T[] {
    return list.reduce((prev, curr) => {
        return !prev.find(model => condition(model, curr)) ? [...prev, curr] : prev;
    }, []);
}

/**
 * To ensure that each element in an array is unique for some specified property. Throws an error where duplicates are found
 * @example
 * validateUniqueValues([
 *     { name: 'John', age: 12 },
 *     { name: 'John', age: 5 },
 *     { name: 'Susan', age: 10 }
 *   ],
 *   person => person.name,
 *   (duplicateName, person1, person2) => `Two people exist with the same name '${duplicateName}'`
 * )
 * @param list List which may contain duplicates
 * @param property A callback function that returns the property for which to consider uniqueness
 * @param errorMessage A callback that returns the error message that is thrown if duplicates are found.
 * This callback has one required argument being the duplicate value, as well as the optional arguments being the two
 * elements that contain this duplicate value
 */
export function validateUniqueValues<T, T2>(
    list: T[],
    property: (item: T) => T2,
    errorMessage: (duplicateValue: T2, item1?: T, item2?: T) => string
) {
    const duplicates = getDuplicates(list, property);
    if (duplicates.length) {
        throw new CliBuildError(errorMessage(property(duplicates[0][0]), duplicates[0][0], duplicates[0][1]));
    }
}


/**
 * Checks whether provided argument is a class constructor
 * @example
 * class MyClass {}
 * isConstructor(MyClass) // equals true
 * @param value constructor or other type
 */
export function isConstructor(value: any): boolean {
    return value ? !!value.prototype && value.prototype.constructor.name !== undefined : false;
}

/**
 * Returns an array
 * @example
 * arrayValue(1) // equals [1]
 * arrayValue([1]) // equals [1]
 * @param value array or non-array value
 */
export function arrayValue<T>(value: T | T[]): T[] {
    if (value) {
        return value instanceof Array ? value : [value];
    }
    return [];
}
