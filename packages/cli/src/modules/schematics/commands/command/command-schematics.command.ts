import { CliCommand, Command, CliParameter, FilePath } from '../../../../../../lib/src/index';
import { CommandSchematicsOptions } from './command-schematics.options';
import { dasherize } from '../../../../../../lib/src/internal/common/utils';
import { capitalize } from '../../../../shared/utils';
import { SchematicsService } from '../../services/schematics.service';
import { TemplateBuilder } from 'src/services';

@CliCommand('command', {
    alias: 'c',
    description: 'creates a new command file',
    options: [CommandSchematicsOptions]
})
export class CommandSchematicsCommand implements Command {

    @CliParameter(1, {
        description: 'name for the command'
    })
    name: string;

    @CliParameter(2, {
        optional: true,
        description: 'directory in which the command should be created (optional)'
    })
    filePath: FilePath;

    constructor(
        private opts: CommandSchematicsOptions,
        private schematics: SchematicsService,
    ) {
    }

    async execute() {
        await this.schematics.create(this.name, this.filePath, TemplateBuilder.templates.Command, 'command', this.getReplacements());
    }

    getReplacements() {
        const hasOptions = this.opts.alias || this.opts.description;
        return [
            ['command_name', dasherize(this.name)],
            ['command_class', capitalize(this.name)],
            ['open_bracket', hasOptions ? ', {' : ''],
            ['close_bracket', hasOptions ? '\n}' : ''],
            ['alias', this.opts.alias ? `\n    alias: '${this.opts.alias}'${this.opts.description ? ',' : ''}` : ''],
            ['description', this.opts.description ? `\n    description: '${this.opts.description}'` : ''],
            ['command_content', '']
        ];
    }

}
