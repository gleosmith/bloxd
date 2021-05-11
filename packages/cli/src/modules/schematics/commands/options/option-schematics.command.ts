import { CliCommand, CliParameter, Command, FilePath } from '../../../../../../lib/src/index';
import { SchematicsService } from '../../services/schematics.service';
import { capitalize } from '../../../../shared/utils';
import { TemplateBuilder } from 'src/services';


@CliCommand('options', {
    alias: 'o',
    description: 'creates a new options file',
})
export class OptionsSchematicsCommand implements Command {

    @CliParameter(1, {
        description: 'name for the new service file'
    })
    name: string;

    @CliParameter(2, {
        optional: true,
        description: 'directory in which the command should be created (optional)'
    })
    filePath: FilePath;

    constructor(
        private schematics: SchematicsService
    ) { }


    async execute() {
        await this.schematics.create(this.name, this.filePath, TemplateBuilder.templates.Options, 'options', this.getReplacements());
    }

    getReplacements() {
        return [
            ['options_class', capitalize(this.name)],
        ];
    }

}
