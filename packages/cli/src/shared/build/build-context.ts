import { LocalDependencyService } from '../../services/local-dependency/locals-dependency.service';
import { dasherize } from '../../../../lib/src/internal/common/utils';
import { Injectable } from '../../../../lib/src/index';
import { FileService } from '../../services/files/file.service';
import * as path from 'path';
import { BuildOptions } from './build.options';
import { PrintingService } from '../../services/printing/printing.service';
import { BaseBuildCommand } from './base-build-command';

export class BuildConfigError extends Error { }

interface BloxdJsonSchema {
    name: string;
    outputDir: string;
    outputName: string;
    srcRoot: string;
    tsConfig: string;
    assets?: string;
    packageJson: string;
    extraWebpack: {
        path: string,
        mergeStrategy: 'replace' | 'merge'
    };
}

@Injectable()
export class BuildContext<T extends BaseBuildCommand> {

    npmPackagePath: string;
    projectDir: string;
    name: string;
    srcRoot: string;
    outputDir: string;
    version: string;
    relativeOutputDir: string;
    outputName: string;
    extraWebpackConfig: any;
    extraWebpackPath: string = null;
    extraWebpackMergeStrategy: string = null;
    production: boolean;
    tsConfigPath: string;
    watch: boolean;
    command: T;


    constructor(
        public printing: PrintingService,
        private files: FileService,
        private opts: BuildOptions,
        public local: LocalDependencyService
    ) { }

    async init(comamnd: T) {
        this.command = comamnd;
        this.projectDir = this.opts.path ? this.opts.path.absolute : process.cwd();
        await this.readConfig();
        this.production = this.opts.prod;
        this.watch = this.opts.watch;
        this.name = this.opts.name ? dasherize(this.opts.name) : this.name;
        this.version = this.opts.buildVersion || this.version;
    }

    async readConfig() {

        if (!this.files.exist(path.join(this.projectDir, 'bloxd.json'))) {
            throw new BuildConfigError(`Error: Cannot find the configuration file ./bloxd.json. Have you run this command in the correct folder?`);
        }
        const config = JSON.parse((await this.files.read(path.join(this.projectDir, 'bloxd.json'))).toString()) as BloxdJsonSchema;

        if (!config.outputDir) {
            throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the "outputDir" property has not been specified`);
        }
        this.outputDir = path.join(this.projectDir, config.outputDir);
        this.relativeOutputDir = config.outputDir;

        if (!config.outputName) {
            throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the "outputName" property has not been specified`);
        }
        this.outputName = config.outputName;


        if (!config.packageJson) {
            throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the "packageJson" property has not been specified`);
        } else {
            if (!this.files.exist(path.join(this.projectDir, config.packageJson))) {
                throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the "packageJson" ${path.join(this.projectDir, config.packageJson)} does not exist`);
            }
            if (!String(config.packageJson.endsWith('.json'))) {
                throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the "packageJson" ${path.join(this.projectDir, config.packageJson)} does not refer to a json file`);
            }
        }
        this.npmPackagePath = path.join(this.projectDir, config.packageJson);

        const jsonPackage = JSON.parse((await this.files.read(path.join(this.projectDir, config.packageJson))).toString())
        this.version = jsonPackage.version;
        this.name = dasherize(jsonPackage.name);
        if (!this.name) {
            throw new BuildConfigError(`Error: Cannot find the name in the package.json file`);
        }
        if (!this.version) {
            throw new BuildConfigError(`Error: Cannot find the version in the package.json file`);
        }

        if (!config.srcRoot) {
            throw new BuildConfigError(`Error: Invalid configuration in package.json - the "srcRoot" property has not been specified`);
        } else {
            if (!this.files.exist(path.join(this.projectDir, config.srcRoot)) && !this.files.isFolder(path.join(this.projectDir, config.srcRoot))) {
                throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the src root folder ${path.join(this.projectDir, config.srcRoot)} is not a folder or does not exist`);
            }
        }
        this.srcRoot = path.join(this.projectDir, config.srcRoot);

        if (!config.tsConfig) {
            throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the "tsConfig" property has not been specified`);
        }
        this.tsConfigPath = path.join(this.projectDir, config.tsConfig);
        await this.readExtraWebpackConfig(config);
    }


    private async readExtraWebpackConfig(config: BloxdJsonSchema) {

        if (config.extraWebpack) {
            if (!config.extraWebpack.path) {
                throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the extraWebpack property has been specified without supplying the path`);
            } else if (!this.files.exist(path.join(this.projectDir, config.extraWebpack.path))) {
                throw new BuildConfigError(`Error: Invalid configuration in bloxd.json -  the extra webpack config file ${this.files.exist(path.join(this.projectDir, config.assets))} does not exist`);
            }
            if (!config.extraWebpack.mergeStrategy) {
                throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the extraWebpack property has been specified without supplying the merge strategy`);
            } else {
                if (config.extraWebpack.mergeStrategy !== 'merge' && config.extraWebpack.mergeStrategy !== 'replace') {
                    throw new BuildConfigError(`Error: Invalid configuration in bloxd.json - the extraWebpack merge strategy can only be "replace" or "merge"`);
                }
            }

            this.extraWebpackPath = path.join(this.projectDir, config.extraWebpack.path);
            this.extraWebpackMergeStrategy = config.extraWebpack.mergeStrategy;

            if (path.extname(this.extraWebpackPath) !== '.js') {
                throw new BuildConfigError(`Error: the extraWebpack path ${this.extraWebpackPath} is not a JavaScript file`);
            }
            try {
                const obj = eval((await this.files.read(this.extraWebpackPath)).toString());
                this.extraWebpackConfig = obj;
            } catch (e) {
                throw new BuildConfigError(`Error: the extraWebpack config has an error.\n\n${e}`);
            }

        }
    }


}