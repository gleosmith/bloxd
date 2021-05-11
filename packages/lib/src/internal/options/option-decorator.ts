import { setMetadata, MetadataKey, pushMetaData, getMetadata } from '../common/meta-data';
import { Type } from '../common/cli-types';
import { OptionDefinition, CliOptionOpts, OptionsOpts, OptionsContainerDefinition } from './option-models';
import { dasherize } from '../common/utils';
import { registerInjectablesArgs } from '../dependency-injection/injectable-arg-definition';
import 'reflect-metadata';


/**
 * A class decorator that marks a class as a cli options container. An options container can contain
 * properties decorated with `@CliOption()` which become command options that can be modified by the user. Providers
 * can be injected into these options contructors. The options themselves be injected as dependencies into commands and/or modules
 * depending on their scope. Options cannot be injected into providers
 *
 * ### SCOPE
 * Options can be provided into the decorator metadata of both options and commands.
 * #### 1. Commands
 * When provided in the metadata for a command only, the options are only injectable into that command's constructor
 * #### 2. Modules
 * When provided into the metadata for module, the options will be injectable within the that module, its' commands, subcommands and child modules.
 * When options are provided into a module that exports commands, those options are also within the scope of the exported commands
 *
 * ### HOOKS
 * Options can implement the `AfterOptionsInit` hook with the `afterOptionsInit()` function. This occurs after the parsed options are bound to the instance
 * but before the modules and command in the execution path are instantiated. This provides a means of layering customized functionality on top of options, such
 * as configuring providers, additional validation, implementing default behavior and implementing input prompts. This hook allows for both synchronous and asynchronous implementations
 *
 * ### EXAMPLE
 * - `<cli> <command> *[options]* [<parameters>]`
 * - `mycli create *--name* *"new-project"* *--debug*`
 *
 * ```ts
 * @CliOptions()
 * export class AppOptions implements AfterOptionsInit {
 *
 *   @CliOption() debug = false
 *
 *   constructor(private logging: LoggingService) { }
 *
 *   afterOptionsInit() {
 *      this.logger.showDebugging(this.debug)
 *   }
 *
 * }
 *
 * @CliOptions()
 * export class CreateOptions {
 *
 *   @CliOption() name: string;
 *
 * }
 *
 * @Command('create', {
 *      options: [CreateOptions]
 * })
 * export class CreateCommand implements Command {
 *
 *   constructor(private appOpts: AppOptions, private createOpts: CreateOptions) {}

 *   execute() {}
 * }
 *
 * @CliModule({
 *  options: [AppOptions],
 *  commands: [CreateCommand],
 *  providers: [LoggingService]
 * })
 * export class AppModule {
 *   constructor(private opts: AppOptions) {}
 * }
 * ```
 *
 * @publicApi
 */
export function CliOptions(opts?: OptionsOpts): ClassDecorator {
    return function <T extends new (...args: any[]) => {}>(target: T) {
        setMetadata<OptionsContainerDefinition>(MetadataKey.Options, target, {
            providers: opts?.providers || []
        });
        registerInjectablesArgs(target);
    } as ClassDecorator;
}

/**
 * A decorator for properties of an options container, which is class decorated with `@CliOptions`. Creates metadata for properties to be bound from
 * options parsed through the cli arguments. Options are set through names/aliases and therefore are not positional
 *
 * ### OPTIONS
 * - **name:** allows customizing the command name used in the cli call. If not provided, the name
 * defaults to the dasherized name of the decorated property. Example, the property named *'showErrors'* can be called with *'--show-errors'*. Note the
 * name should not include the *'--'* prefix.
 * - **alias:** an additional shorthand call sign for a cli option. When called, aliases are prefixed with a single dash *'-n'* where full names are prefixed with
 * a double dash *'--name'*. The default value is undefined
 * - **description:** additional metadata that allows for more informative help messages
 * - **required:** by default options are optional and not required in a cli command call. Specifying options as required will cause an
 * error will be thrown if the user does not provide the option in the cli call. If the `HelpModule` has been utilized, the error will be caught and the cli help
 * will be displayed
 * - **data:** placeholder for custom metadata to be attached for use in a custom implementation of the `HelpModule`
 * - **typeChecks:** when true the argument parsing engine will take the design type of the decorated property, and validate the
 * raw (string) cli argument against this type. If the validation is successful, it will cast to raw argument to this design type before
 * binding it to the property. The default type casting only works on basic types, being strings, booleans and numbers, in addition to special `FilePath` and `Int`
 * types. Where a more complex, unrecognized type is used, the property will be bound with a its' original value. The type casting option is also provided globally in the ParserModule.
 * This global configuration is applied when this option is unset in the decorator of a specific option.
 *
 * ### EXAMPLE
 * - `<cli> <command> *[options]* [<parameters>]`
 * - `mycli build *--name* *"new-project"* *--prod*`
 * - `mycli build *--n* *"new-project"* *-p*`
 *
 * ```ts
 * @CliOptions()
 * export class BuildOptions {
 *
 *   @CliOption({ alias: 'n' }) name = '';
 *   @CliOption({ alias: 'p' }) prod = false;
 *
 * }
 * ```
 *
 * @publicApi
 * @param opts additional options
 */
export function CliOption(opts?: CliOptionOpts): PropertyDecorator {
    return function (target: any, propertyKey: string) {
        pushMetaData<OptionDefinition>(MetadataKey.Option, target.constructor, {
            alias: opts?.alias,
            propertyName: propertyKey,
            description: opts?.description,
            name: opts?.name || dasherize(propertyKey),
            typeChecks: opts?.typeChecks,
            required: opts?.required || false,
            data: opts?.data,
            designType: Reflect.getMetadata('design:type', target, propertyKey),
  
        });
    };
}

/**
 * Returns option metadata attached to a constructor
 * @param constructor constructor
 */
export function getCliOptions(constructor: Type<any>) {
    return getMetadata<OptionDefinition[]>(MetadataKey.Option, constructor) || [];
}
