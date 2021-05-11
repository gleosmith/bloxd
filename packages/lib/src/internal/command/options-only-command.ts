import { MissingCommandError } from '../common/cli-types';
import { Command } from './command-models';

/**
 * A special type of command that throws a `MissingCommandError` when executed. This class should be extended by star commands when the
 * is a requirement to have to have a star command that is not executable but does implement certain behavior if called with an option flag. 
 * 
 * A common example is the `--version` flag. For example, if we have a cli called `my-cli` and we want to be able to display the cli version with 
 * `my-cli --version`. However, if the version option is ommitted a there is no requirement to execute any logic and instead a help message should be
 * displayed to the user. In this case, a star command can be utilized which extends the `OptionsOnlyCommand` with relevent options metadata declared in the
 * command decorator
 * 
 * ```ts
 * @CliOptions()
 * export class AppOptions implements AfterOptionsInit {
 *
 *   @CliOption({
 *       alias: 'v',
 *       description: 'Shows the cli version'
 *   })
 *   version: boolean;
 *
 *   constructor(private app: AppContext) { }
 *
 *   afterOptionsInit() {
 *       if (this.version) {
 *           console.log(`v${this.app.version}`);
 *           process.exit();
 *       }
 *   }
 * }
 *
 * @CliCommand('*', {
 *   options: AppOptions
 * })
 * export class AppCommand extends OptionsOnlyCommand {}
 *
 * @CliModule({
 *   commands: [
 *     AppCommand,
 *   ]
 * })}
 * ```
 * @publicApi
 */
export class OptionsOnlyCommand implements Command {

    constructor() { }

    execute() {
        throw new MissingCommandError('Expected a command')
    }

}