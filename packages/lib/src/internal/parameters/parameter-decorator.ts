import { MetadataKey, mergeMetaData } from '../common/meta-data';
import { dasherize } from '../common/utils';
import { ParameterDefinition, CliParameterOpts } from './parameter-models';

/**
 * A decorator used on command properties to provide metadata that defines positional cli parameters.
 * As parameters are positional, the index of the parameter must be supplied to the decorator. Defining a parameter with an
 * array type allows undetermined amount of parameters to be supplied. The decorator also takes optional metadata for more
 * informative help messages through the `HelpModule`. The usage of this decorator on any other classes, other
 * than a command, will have no effect.
 *
 * ### OPTIONS
 * - **optional:** optional parameters don't need to be provided by the user when calls are made to the specific cli command. In contrast,
 * if required parameters are missed an error will be thrown. If the `HelpModule` has been utilized, this error will be caught and the cli help
 * will be displayed. Optional parameters cannot be positioned before required parameters. Defaults to false.
 * - **name:** allows customizing the parameter name for when it is displayed in help messages. If this option is not provided, this
 * defaults to the dasherized name of the decorated property. Example: *dirPath* will become *dir-path*
 * - **description:** additional metadata that allows for more informative help messages
 * - **typeChecks:** when true the argument parsing engine will take the design type of the decorated property, and validate the
 * raw (string) cli argument against this type. If the validation is successful, it will cast to raw argument to this design type before
 * binding it to the property. The default type casting only works on basic types, being strings, booleans and numbers, in addition to special `FilePath` and `Int`
 * types. Where a more complex, unrecognized type is used, the property will be bound with its' orignal value.
 * The type casting option is also provided globally in the ParserModule.
 * This global configuration is applied when this option is unset in the decorator of a specific parameter.
 * - **data:** Placeholder for custom metadata to be attached for use in a custom implementation of the `HelpModule`
 *
 *
 * ### Example
 * - `<cli> <command> [options] *[<parameters>]*`
 * - `mycli init --name "new-project" *./my-project/src*`
 *
 * ```ts
 * @CliCommand('init')
 * export class InitCommand implements Command {
 *
 *   @CliParameter(1) dirPath: string;
 *   @CliParameter(2, { optional: true }) outputPath = './'
 *
 *   constructor() {}
 *
 *   execute() {
 *   }
 *
 * }
 * ```
 *
 * @publicApi
 *
 * @param index positional index of the parameter, starting at 1
 * @param opts additional options
 */
export function CliParameter(index: number, opts?: CliParameterOpts): PropertyDecorator {
    return function (target: any, propertyKey: string) {
        mergeMetaData<ParameterDefinition>(MetadataKey.Parameter, target.constructor, (x) => x.propertyName === propertyKey, {
            index,
            name: opts?.name || dasherize(propertyKey),
            propertyName: propertyKey,
            description: opts?.description,
            optional: opts?.optional || false,
            typeChecks: opts?.typeChecks,
            data: opts?.data,
            isArray: Reflect.getMetadata('design:type', target, propertyKey) === Array,
            designType: Reflect.getMetadata('design:type', target, propertyKey)
        });
    };
}
