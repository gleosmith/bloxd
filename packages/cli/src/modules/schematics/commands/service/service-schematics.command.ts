import { CliCommand, CliParameter, Command, FilePath } from '../../../../../../lib/src/index';
import { ServiceSchematicsOptions as ServiceSchematicsOptions } from './service-schematics.options';
import { SchematicsService } from '../../services/schematics.service';
import { capitalize } from '../../../../shared/utils';
import { TemplateBuilder } from 'src/services';

@CliCommand('service', {
    alias: 's',
    description: 'creates a new service file',
    options: ServiceSchematicsOptions
})
export class ServiceSchematicsCommand implements Command {

    @CliParameter(1, {
        description: 'name for the new service file'
    })
    name: string;

    constructor(
        private opts: ServiceSchematicsOptions,
        private schematics: SchematicsService
    ) { }

    @CliParameter(2, {
        optional: true,
        description: 'directory in which the command should be created (optional)'
    })
    filePath: FilePath;


    async execute() {
        await this.schematics.create(this.name, this.filePath, TemplateBuilder.templates.Service, 'service', this.getReplacements());
    }

    getReplacements() {
        const hasOptions = this.opts.global || this.opts.notSingleton;

        return [
            ['service_class', capitalize(this.name)],
            ['open_bracket', hasOptions ? '{' : ''],
            ['global', this.opts.global ? `\n    global: true${this.opts.notSingleton ? ',' : ''}` : ''],
            ['singleton', this.opts.notSingleton ? `\n    singleton: false` : ''],
            ['close_bracket', hasOptions ? '\n}' : ''],
        ];
    }

}
