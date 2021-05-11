import { Injectable, AppContext, FilePath } from '../../../../../lib/src/index';
import { TemplateBuilder } from '../../../services';
import * as chalk from 'chalk';
import { FileService } from '../../../services/files/file.service';
import { dasherize } from '../../../shared/utils';
import * as path from 'path';

@Injectable()
export class SchematicsService {

    constructor(
        private templates: TemplateBuilder,
        private files: FileService,
        private app: AppContext
    ) {
    }

    async create(
        name: string,
        filePath: FilePath,
        templateString: string,
        templateName: string,
        replacements: string[][]
    ) {

        const basePath = filePath ? filePath.relative : './';
        if (!this.files.isFolder(this.app.relativeToCwd(basePath))) {
            process.stderr.write(chalk.red(`Error: the path ${this.app.relativeToCwd(basePath)} is not a valid directory`));
            return;
        }

        if (this.files.exist(this.app.relativeToCwd(path.join(basePath, `./${dasherize(name)}.${templateName}.ts`)))) {
            process.stderr.write(chalk.red(`Error: can\'t create a new ${templateName} file called ${dasherize(name)} because the file ${dasherize(name)}.${templateName}.ts already exists in this directory`));
            return;
        }
        await this.templates.write(templateString, path.join(basePath, `./${dasherize(name)}.${templateName}.ts`), replacements);
        process.stdout.write(`${chalk.green('[created]')} ${dasherize(name)}.${templateName}.ts`);
    }


}
