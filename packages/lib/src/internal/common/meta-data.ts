import 'reflect-metadata';
import { Type } from './cli-types';

/**
 * Keys used to describe the metadata for various decorators
 */
export enum MetadataKey {
    Command = 'CommandMetadata',
    InjectableArgs = 'InjectableArgsMetadata',
    Provider = 'ProviderMetadata',
    Parameter = 'ParameterMetadata',
    Module = 'ModuleMetadata',
    Option = 'OptionMetadata',
    Options = 'OptionsMetadata',
    BeforeExecute = 'BeforeExecuteMetadata',
    AfterExecute = 'AfterExecuteMetadata',
    DesignParameters = 'design:paramtypes'
}

/**
 * Returns metadata on the provided constructor for a particular key
 * @param key Key from the {@link MetadataKey} enum
 * @param target Class constructor
 */
export function getMetadata<T = any>(key: MetadataKey, target: Type<any>) {
    return Reflect.getMetadata(key, target) as T;
}

/**
 * Adds data to a metadata array for the provided constructor. If no metadata exists, a new array is created with the provided data
 * @param key Key from the {@link MetadataKey} enum
 * @param target Class constructor
 * @param data data to add to the metadata array
 */
export function pushMetaData<T = any>(key: MetadataKey, target: Type<any>, data: T) {
    const array = getMetadata<any[]>(key, target);
    if (array) {
        array.push(data);
    } else {
        setMetadata(key, target, [data]);
    }
}

/**
 * Iterates through a metadata array on a constructor and merges the provided data with a matched element if it meets the specified condition.
 * If the specified condition is not found, a new element is added to the end of the array. If no metadata exists on the constructor for the provided
 * key, a new array is attached as the metadata with the provided data.
 * @param key Key from the {@link MetadataKey} enum
 * @param target Class constructor
 * @param where Condition to find an element in the metadata array where the data should be merged
 * @param data Data to add/merge into the metadata array
 */
export function mergeMetaData<T = any>(key: MetadataKey, target: Type<any>, where: (item: T) => any, data: T) {
    const array = getMetadata<any[]>(key, target);
    if (array) {
        const item = array.find(val => where(val));
        if (item) {
            array.splice(array.indexOf(item), 1, { ...item, ...data });
        } else {
            array.push(data);
        }
    } else {
        setMetadata(key, target, [data]);
    }
}

/**
 * Adds metadata to a constructor for a specified key
 * @param key Key from the {@link MetadataKey} enum
 * @param target Class constructor
 * @param data Metadata to attach
 */
export function setMetadata<T = any>(key: MetadataKey, target: Type<any>, data: T) {
    Reflect.defineMetadata(key, data, target);
}

/**
 * Returns whether metadata exists on a constructor for a specified key
 * @param key Key from the {@link MetadataKey} enum
 * @param target Class constructor
 */
export function hasMetadata<T>(key: MetadataKey, target: Type<any>) {
    return Reflect.hasOwnMetadata(key, target);
}
