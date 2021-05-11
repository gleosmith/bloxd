import { Injectable, AppContext } from '../../../../lib/src/index';
import { FileService } from '../files/file.service';



@Injectable()
export class TemplateBuilder {

    static templates: any = {
        BloxdJson: require('./../../../templates/bloxd-json.template').default,
        NpmPackage: require('./../../../templates/json-package.template').default,
        Command: require('./../../../templates/command.template').default,
        Service: require('./../../../templates/service.template').default,
        Options: require('./../../../templates/options.template').default,
        Module: require('./../../../templates/module.template').default,
        Main: require('./../../../templates/main.template').default,
        TsConfig: require('./../../../templates/tsconfig.template').default,
        HelpModule: require('./../../../templates/help-module.template').default,
        TsLint: require('./../../../templates/tslint.template').default,
        Webpack: require('./../../../templates/webpack.template').default,
    }

    constructor(
        private files: FileService,
        private app: AppContext
    ) {
    }

    async write(template: string, outputPath: string, replacements?: string[][]) {
        (replacements || []).forEach(r => template = this.replaceAll(template, r[0], r[1]));
        await this.files.write(this.app.relativeToCwd(outputPath), template);
    }

    private replaceAll(file: string, placeholder: string, withText: string) {
        while (file.indexOf(`$[${placeholder}]`) !== -1) {
            file = file.replace(`$[${placeholder}]`, withText);
        }
        return file;
    }

}