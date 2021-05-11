import { CommandDescription } from './../command/command-models';
import { HelpModule } from './help-module';
import { RegisteredRoute } from './../command/registered-route';
import { ModuleRef } from '../module/module-ref';

/**
 * An injectable service that provides access to a description of the active command which can be utilized to display help messages
 *
 * @publicApi
 */
export class HelpContext {
    

    constructor(
        private route: RegisteredRoute,
        private moduleRef: ModuleRef,
        private helpModule: HelpModule
    ) {
    }

    /**
     * Returns a description of the active command
     */
    getDescription(): CommandDescription  {
        return this.helpModule.activeDescription(this.moduleRef, this.route);
    }

}
