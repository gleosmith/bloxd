import { AppContext } from './../../lib/src/internal/app/app-context';
import { AfterOptionsInit } from './../../lib/src/internal/options/option-hooks';
import { CliOptions, CliOption } from '../../lib/src';


@CliOptions()
export class AppOptions implements AfterOptionsInit {

    @CliOption({
        alias: 'v',
        description: 'Shows the cli version'
    })
    version: boolean;

    constructor(
        private app: AppContext
    ) {
    }

    afterOptionsInit() {
        if (this.version) {
            process.stdout.write(`v${this.app.version}`);
            process.exit()
        }
    }

}
