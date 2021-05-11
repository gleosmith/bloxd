import { WebpackPluginInstance } from 'webpack';
import { BuildConfigError, BuildContext } from '../build-context';
import { BaseBuildCommand } from '../base-build-command';
import { LocalDependencyService } from 'src/services/local-dependency/locals-dependency.service';
import { NpmPackagePlugin } from './npm-package-plugin';

export interface WebpackPluginFactory {

    resolve(ctx: BuildContext<BaseBuildCommand>): WebpackPluginInstance;

}

export const bannerPlugin: WebpackPluginFactory = {

    resolve(ctx: BuildContext<BaseBuildCommand>) {

        const BannerPlugin = resolveDependency('webpack', ctx.local).BannerPlugin;
        return new BannerPlugin({ banner: '#!/usr/bin/env node', raw: true });
    }

};

export const jsonPackageFactory: WebpackPluginFactory = {

    resolve(ctx: BuildContext<BaseBuildCommand>) {
        return new NpmPackagePlugin({
            file: ctx.npmPackagePath,
            outputDir: ctx.outputDir,
            package: {
                bin: {
                    [ctx.name]: `./${ctx.outputName}.js`
                }
            }
        });
    }

}; 


export const circularDepsPlugin: WebpackPluginFactory = {

    resolve(ctx: BuildContext<BaseBuildCommand>) {
        const plugin = resolveDependency('circular-dependency-plugin', ctx.local);
        return new plugin({
            exclude: /node_modules/,
            include: new RegExp(ctx.srcRoot),
            failOnError: false,
            allowAsyncCycles: false,
            cwd: process.cwd(),
        });
    }

}


export const definePlugin: WebpackPluginFactory = {

    resolve(ctx: BuildContext<BaseBuildCommand>) {
        const webpack = resolveDependency('webpack', ctx.local);
        return new webpack.DefinePlugin({
            __BLOXD_CLI_NAME__: JSON.stringify(ctx.name),
            __BLOXD_CLI_VERSION__: JSON.stringify(ctx.version)
        });
    }

};


export function resolveDependency<T = any>(dependencyName: string, dependencies: LocalDependencyService): T {
    try {
        return dependencies.require(dependencyName);
    } catch (e) {
        throw new BuildConfigError(`Dependency not found! Please ensure ${dependencyName} has been installed and exists in your project dependencies 'npm install ${dependencyName} --save-dev'`)
    }
}

