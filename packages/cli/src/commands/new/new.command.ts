import { CliCommand, CliParameter, Command, AppContext, FilePath } from '../../../../lib/src/index';
import { FileService } from '../../services/files/file.service';
import {  TemplateBuilder } from '../../services/templates/template-builder.service';
import { dasherize } from '../../shared/utils';
import * as path from 'path';
import chalk = require('chalk');
import { PrintingService } from '../../services/printing/printing.service';
import { exec, spawn } from 'child_process';
import { NewOptions } from './new.options';


@CliCommand('new', {
    alias: 'n',
    description: 'creates a new project in the current directory',
    options: [NewOptions]
})
export class NewCommand implements Command {

    @CliParameter(1, {
        description: 'name of the application'
    })
    name: string;

    @CliParameter(2, {
        optional: true,
        description: 'directory in which to create the project'
    })
    filePath: FilePath;

    constructor(
        private templateService: TemplateBuilder,
        private printing: PrintingService,
        private files: FileService,
        private app: AppContext,
        private opts: NewOptions
    ) { }

    async execute() {
        const folderName = dasherize(this.name);
        const rootDir = path.join(this.filePath?.relative || '', `./${folderName}`);
        if (this.files.exist(this.app.relativeToCwd(rootDir))) {
            process.stderr.write(chalk.redBright(`Error: Cannot create a new project called '${folderName}' as a folder already exists in the directory with that name`));
            return;
        }
        this.files.newFolder(this.app.relativeToCwd(rootDir));
        await this.writeTemplates(rootDir);
    }

    private async writeTemplates(folderName: string) {

        await this.templateService.write(TemplateBuilder.templates.TsLint, `${folderName}/tslint.json`);
        await this.templateService.write(TemplateBuilder.templates.TsConfig, `${folderName}/tsconfig.json`);

        await this.templateService.write(TemplateBuilder.templates.NpmPackage, `${folderName}/package.json`, [
            ['name', folderName]
        ]);

        await this.templateService.write(TemplateBuilder.templates.BloxdJson, `${folderName}/bloxd.json`, [
            ['name', folderName],
            ['webpack', this.opts.webpack ? `,\n    "extraWebpack": {\n        "path": "./webpack.config.js",\n        "mergeStrategy": "merge"\n    }` : '']
        ]);

        if (this.opts.webpack) {
            await this.templateService.write(TemplateBuilder.templates.Webpack, `${folderName}/webpack.config.js`);
        }

        const srcFolder = path.join(folderName, './src');
        this.files.newFolder(srcFolder);

        await this.templateService.write(TemplateBuilder.templates.Main, `${srcFolder}/main.ts`);

        await this.templateService.write(TemplateBuilder.templates.Module, `${srcFolder}/app.module.ts`, [
            ['module_class', 'App'],
            ['module_metadata', '\n    commands: [HelloCommand],\n    imports: [\n        ParserModule,\n        HelpModule\n    ]\n'],
            ['module_imports', `import { CliModule, ParserModule, HelpModule } from 'bloxd';\nimport { HelloCommand } from './hello.command';\n`]
        ]);

        await this.templateService.write(TemplateBuilder.templates.Command, `${srcFolder}/hello.command.ts`, [
            ['command_name', 'hello'],
            ['command_class', 'Hello'],
            ['open_bracket', ', {'],
            ['close_bracket', '\n}'],
            ['alias', `\n    alias: 'h',`],
            ['description', `\n    description: 'Say hello'`],
            ['command_content', '\n      console.log(\'Hi there....\');']
        ]);

        this.printing.initLoader(`${this.printing.green('[bloxd]', true)} installing dependencies`);
        try {
            await this.npmInstall(folderName);
            this.printing.clearLoader();
            process.stdout.write(`${chalk.greenBright('[bloxd]')} successfully created new project ${chalk.whiteBright(folderName)}`);
        } catch (e) {
            this.printing.clearLoader();
            process.stderr.write(`${chalk.red('[bloxd]')} failed to create project`);
            process.stderr.write(chalk.redBright(e.message));
        }

    }

    private async npmInstall(folderName: string) {
        return new Promise<void>((resolve, reject) => {

            let info = '';

            const child = exec('npm install', { cwd: folderName }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    if(info) {
                        process.stdout.write(info);
                    }
                    resolve();
                }
            });

            child.stdout.on('data', (data) => {
                info += `\n${data}`;
            });

            child.stderr.on('data', (data) => {
                info +=`\n${this.printing.yellow(data, true)}`;
            });
        });
    }

}
