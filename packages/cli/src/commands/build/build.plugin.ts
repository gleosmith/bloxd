import { PrintingService } from './../../services/printing/printing.service';
import { BaseWebpackPlugin} from './../../shared/build';

export class BuildWebpackPlugin extends BaseWebpackPlugin {

    readonly pluginName = 'BloxdBuildPlugin';

    constructor(
        printing: PrintingService,
        watch: boolean,
    ) {
        super(printing, watch)
    }

}