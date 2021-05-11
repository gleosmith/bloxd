import { CliModule, HelpModule } from '../../../../lib/src/index';
import { HelpOptions } from './help.options';


@CliModule({
    imports: [
        HelpModule
    ],
    exports: [
        HelpModule,
        HelpOptions
    ]
})
export class AppHelpModule {}
