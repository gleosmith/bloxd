import { emitKeypressEvents } from 'readline';
import { PrintingService } from './../../services/printing/printing.service';
import { BaseWebpackPlugin} from './../../shared/build';

export class BuildWebpackPlugin extends BaseWebpackPlugin {

    readonly pluginName = 'BloxdBuildPlugin';
    private changeCounter = 0;

    constructor(
        printing: PrintingService,
        watch: boolean,
    ) {
        super(printing, watch)
    }
    
    beforeApply() {
        this.changeCounter = 0;
        if (this.watch) {
            emitKeypressEvents(process.stdin);
            process.stdin.on('keypress', (str, key) => {
                if (key.ctrl && key.name === 'c') {
                    process.exit()
                }
            })
        }
    }

    beforeCompile() {
        if (this.changeCounter > 0) {
            this.info(`detected changes\n`, true)
        }
        this.changeCounter++;
    }

    afterBuild(status: string) {
        if (this.watch) {
            this.info('waiting for code changes....', true)
        }
    }

}