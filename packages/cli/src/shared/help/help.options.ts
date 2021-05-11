import { CliOptions, CliOption, HelpContext,  COMMAND_HELP, Inject, CommandHelp, AfterOptionsInit  } from '../../../../lib/src/index';

@CliOptions()
export class HelpOptions implements AfterOptionsInit {

    @CliOption({
        alias: 'h',
        description: 'shows usage of the CLI command'
    })
    help: boolean

    constructor(
        private helpContext: HelpContext,
        @Inject(COMMAND_HELP) private commandHelp: CommandHelp
    ) { 
    }

    afterOptionsInit() {
        if(this.help) {
            this.commandHelp.showHelp(this.helpContext.getDescription())
            process.exit();
        }
    }

}