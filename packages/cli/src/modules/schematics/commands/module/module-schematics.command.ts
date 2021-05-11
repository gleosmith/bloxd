import { capitalize } from './../../../../shared/utils';
import { CliCommand, Command, CliParameter, FilePath } from '../../../../../../lib/src/index';
import { SchematicsService } from '../../services/schematics.service';
import {  TemplateBuilder } from 'src/services';



@CliCommand('module', {
    alias: 'm',
    description: 'creates a module file',
})
export class ModuleSchematicsCommand implements Command {

    @CliParameter(1, {
        description: 'name for the module'
    })
    name: string;

    @CliParameter(2, {
        optional: true,
        description: 'directory in which the module should be created (optional)'
    })
    filePath: FilePath;

    constructor(
        private schematics: SchematicsService,
    ) {
    }

    async execute() {
        await this.schematics.create(this.name, this.filePath, TemplateBuilder.templates.Module, 'module', this.getReplacements());
    }

    getReplacements() {
        return [
            ['module_class', capitalize(this.name)],
            ['module_metadata', '\n'],
            ['module_imports', `import { CliModule, ParserModule } from 'bloxd';`]
        ];
    }

}
