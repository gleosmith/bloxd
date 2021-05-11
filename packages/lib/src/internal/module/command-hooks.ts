import { Type } from '../common/cli-types';
import { pushMetaData, MetadataKey } from '../common/meta-data';
import { Command } from '../command/command-models';

/**
 * Metadata for the @BeforeExecute() and @AfterExecute() command hooks on modules
 */
export interface CommandHookDefinition {

    /**
     * Name of the decorated method
     */
    methodName: string;

    /**
     * Command constructors supplied to the decorator
     */
    commands: Type<Command>[];

}

/**
 * A method decorator for functions of a CliModule which marks the method as a command hook which is executed before commands
 * and/or sub commands of the module are executed. The commands for which the hook is executed can be modified by supplying the command classes
 * as an argument to the decorator. Not supplying this argument, or supplying an empty array means that the hook will be implemented for all commands
 * and/or sub commands within the module
 *
 * ```ts
 * @CliModule({
 *   options: [DebugOptions]
 *   commands: [CreateCommand, DeleteCommand, HelpCommand],
 *   services: [AuthService, LoggerService],
 * })
 * export class AppModule {
 *
 *   constructor(
 *     private debugOpts: DebugOptions,
 *     private auth: AuthService,
 *     private logger: LoggerService
 *   ) {
 *   }
 *
 *   @BeforeExecute()
 *   setLogLevel() {
 *       this.logger.debugLevel = this.debugOpts.debugLevel || 'errors'
 *   }
 *
 *   @BeforeExecute([CreateCommand, DeleteCommand])
 *   async login() {
 *       if(!this.auth.isLoggedIn) {
 *           await this.auth.promptLogin()
 *       }
 *   }
 *
 *   @AfterExecute([CreateCommand, DeleteCommand])
 *   async logout() {
 *     await this.auth.askToLogout();
 *   }
 *
 *}
 * ```
 * @publicApi
 * @param commands List of commands for which the hook must be implemented. If empty the hook will be applied to all commands
 */
export function BeforeExecute(commands?: Type<Command>[]) {
    return function <CommandType extends Command, T extends () => void | Promise<any>>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
        pushMetaData(MetadataKey.BeforeExecute, target.constructor, {
            methodName: propertyKey,
            commands: commands || []
        } as CommandHookDefinition);
    };
}

/**
 * A method decorator for functions of a CliModule which marks the method as a command hook which is executed after commands
 * and/or sub commands of the module are executed. The commands for which the hook is executed can be modified by supplying the command classes
 * as an argument to the decorator. Not supplying this argument, or supplying an empty array means that the hook will be implemented for all commands
 * and/or sub commands within the module
 *
 * ```ts
 * @CliModule({
 *   options: [DebugOptions]
 *   commands: [CreateCommand, DeleteCommand, HelpCommand],
 *   services: [AuthService, LoggerService],
 * })
 * export class AppModule {
 *
 *   constructor(
 *     private debugOpts: DebugOptions,
 *     private auth: AuthService,
 *     private logger: LoggerService
 *   ) {
 *   }
 *
 *   @BeforeExecute()
 *   setLogLevel() {
 *       this.logger.debugLevel = this.debugOpts.debugLevel || 'errors'
 *   }
 *
 *   @BeforeExecute([CreateCommand, DeleteCommand])
 *   async login() {
 *       if(!this.auth.isLoggedIn) {
 *           await this.auth.promptLogin()
 *       }
 *   }
 *
 *   @AfterExecute([CreateCommand, DeleteCommand])
 *   async logout() {
 *     await this.auth.askToLogout();
 *   }
 *
 *}
 * ```
 * @publicApi
 * @param commands List of commands for which the hook must be implemented. If empty the hook will be applied to all commands
 */
export function AfterExecute(commands?: Type<Command>[]) {
    return function <CommandType extends Command, T extends () => void | Promise<any>>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) {
        pushMetaData(MetadataKey.AfterExecute, target.constructor, {
            methodName: propertyKey,
            commands: commands || []
        } as CommandHookDefinition);
    };
}
