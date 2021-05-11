import { LocalDependencyService } from './services/local-dependency/locals-dependency.service';
import { AppCommand } from './app.command';
import { CliModule, ParserModule, BeforeExecute } from '../../lib/src/index';
import { FileService } from './services/files/file.service';
import { TemplateBuilder } from './services/templates/template-builder.service';
import { SchematicsModule } from './modules/schematics/schematics.module';
import { PrintingService } from './services/printing/printing.service';
import { RunCommand } from './commands/run/run.command';
import { BuildCommand } from './commands/build/build.command';
import { NewCommand } from './commands/new/new.command';
import { AppHelpModule } from './shared/help/help.module';

@CliModule({
    commands: [
        AppCommand,
        BuildCommand,
        RunCommand,
        NewCommand,
        {
            path: 'generate',
            alias: 'g',
            description: 'schematics for creating new files',
            module: SchematicsModule
        },
    ],
    providers: [
        FileService,
        TemplateBuilder,
        PrintingService,
        LocalDependencyService
    ],
    imports: [
        ParserModule,
        AppHelpModule,
    ]
})
export class AppModule {

    constructor(
        private locals: LocalDependencyService
    ) { }

    @BeforeExecute([RunCommand, BuildCommand])
    async checkForLocalResources() {
        await this.locals.tryRunLocally();
    }

}
