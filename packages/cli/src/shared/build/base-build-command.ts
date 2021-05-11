import { PrintingService } from "../../services";
import { bannerPlugin, circularDepsPlugin, definePlugin, jsonPackageFactory, resolveDependency, WebpackPluginFactory } from "./webpack/plugin-factories";
import { Configuration } from "webpack";
import { tsLoader } from "./webpack/loader-factories";
import { BuildConfigError, BuildContext } from "./build-context";

export abstract class BaseBuildCommand<T extends BaseBuildCommand = any> {


    private webpack: Function;
    private merge: any;

    constructor(
        private printing: PrintingService,
        private buildContext: BuildContext<T>
    ) { }



    abstract getWebpackPlugins(): WebpackPluginFactory[];


    async execute() {
        try {
            this.webpack = resolveDependency('webpack', this.buildContext.local);
            this.merge = resolveDependency('webpack-merge', this.buildContext.local);
            await this.buildContext.init(this as any as T);
            await this.buildWebpack(this.buildContext);
        } catch (e) {
            this.handleError(e);
        }
    }


    private getBaseWebpackPlugins(ctx: BuildContext<T>): WebpackPluginFactory[] {
        return [
            bannerPlugin,
            circularDepsPlugin,
            definePlugin,
            ...(ctx.production ? [jsonPackageFactory] : [])
        ]
    }

    private async buildWebpack(ctx: BuildContext<T>) {

        let config: Configuration = {
            ...this.baseWebpackConfig(),
            plugins: this.resolvePlugins(ctx).map(factory => factory.resolve(ctx)),
            mode: ctx.production ? 'production' : 'development',
            context: ctx.projectDir,
            stats: 'errors-warnings',
            module: {
                rules: this.getLoaders().map(factory => factory.resolve(ctx))
            },
            entry: `${ctx.srcRoot}\\main.ts`,
            watch: ctx.watch,
            devtool: ctx.production ? undefined : 'source-map',
            output: {
                filename: `${ctx.outputName}.js`,
                libraryTarget: 'umd',
                path: ctx.outputDir,
                clean: true
            },
        };

        if (ctx.production) {
            const TerserPlugin = resolveDependency('terser-webpack-plugin', ctx.local)
            config.optimization = {
                minimizer: [new TerserPlugin({
                    extractComments: false,
                })],
            }
        }

        if (ctx.extraWebpackPath) {
            config = ctx.extraWebpackMergeStrategy === 'replace' ? { ...config, ...ctx.extraWebpackConfig } : this.merge.merge(config, ctx.extraWebpackConfig);
        }

        process.env.BLOXD_BUILD_NAME = ctx.name;
        if (!ctx.watch) {
            const wb = this.webpack(config);
            return new Promise((resolve, reject) => {
                wb.run((err, stats) => resolve(stats));
            });
        } else {
            const wb = this.webpack(config, () => { });
            return new Promise((resolve, reject) => {
                wb.watch({ aggregateTimeout: 200, ...(config.watchOptions || {}) }, (err, stats) => resolve(stats));
            });
        }

    }

    private resolvePlugins(ctx: BuildContext<T>) {
        return [
            ...this.getBaseWebpackPlugins(ctx),
            ...this.getWebpackPlugins()
        ];
    }

    private getLoaders() {
        return [
            tsLoader
        ];
    }

    private baseWebpackConfig(): Configuration {
        return {
            target: 'node',
            plugins: [],
            resolve: {
                extensions: ['.tsx', '.ts', '.js', '.json'],
            }
        };
    }


    private handleError(err: any) {
        if (err instanceof BuildConfigError) {
            process.stderr.write(this.printing.red(err.message, true));
        } else {
            process.stderr.write(this.printing.red(err));
        }
        process.exit()
    }

}