import * as fs from 'fs';
import * as path from 'path';
import * as utils from 'schema-utils';
import { Compiler, WebpackPluginInstance } from 'webpack';

const schema: any = {
    type: 'object',
    properties: {
        file: {
            type: 'string'
        },
        outputDir: {
            type: 'string'
        },
        package: {
            type: 'object'
        }
    }
};


export  class NpmPackagePlugin implements WebpackPluginInstance {

    options: any;
    
    constructor(opts: any) {
        utils.validate(schema, opts)
        this.options = opts;
    }
    apply(compiler: Compiler) {
        compiler.hooks.done.tap('PackagePlugin', compilation => {
            const packagePath = path.isAbsolute(this.options.file) ? this.options.file : path.join(process.cwd(), this.options.file);
            const outputPath = path.isAbsolute(this.options.outputDir) ? this.options.outputDir : path.join(process.cwd(), this.options.outputDir)
            fs.writeFileSync(
                path.join(outputPath, './package.json'),
                JSON.stringify({
                    ...JSON.parse(fs.readFileSync(packagePath).toString()),
                    ...this.options.package
                }, null, 4))
        });
    }
}
