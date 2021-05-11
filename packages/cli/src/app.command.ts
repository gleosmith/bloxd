import { OptionsOnlyCommand } from './../../lib/src/internal/command/options-only-command';
import { AppOptions } from './app.options';
import { CliCommand } from "../../lib/src";

@CliCommand('*', {
    options: [AppOptions]
})
export class AppCommand extends OptionsOnlyCommand {

}