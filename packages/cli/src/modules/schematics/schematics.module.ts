import { CliModule } from '../../../../lib/src/index';
import { CommandSchematicsCommand } from './commands/command/command-schematics.command';
import { SchematicsService } from './services/schematics.service';
import { ModuleSchematicsCommand } from './commands/module/module-schematics.command';
import { ServiceSchematicsCommand } from './commands/service/service-schematics.command';
import { OptionsSchematicsCommand } from './commands/options/option-schematics.command';
import { AppHelpModule } from '../../shared/help/help.module';

@CliModule({
    commands: [
        CommandSchematicsCommand,
        ModuleSchematicsCommand,
        ServiceSchematicsCommand,
        OptionsSchematicsCommand
    ],
    providers: [
        SchematicsService
    ],
    imports: [
        AppHelpModule
    ]
})
export class SchematicsModule {
}