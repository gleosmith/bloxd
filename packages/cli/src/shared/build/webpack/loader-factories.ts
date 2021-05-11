import { RuleSetRule } from 'webpack';
import { BaseBuildCommand } from '../base-build-command';
import { BuildContext } from '../build-context';


export interface WebpackLoaderFactory {
    resolve: (ctx: BuildContext<BaseBuildCommand>) => RuleSetRule;
}


export const tsLoader: WebpackLoaderFactory = {

    resolve(ctx: BuildContext<BaseBuildCommand>) {
        return {
            test: /\.tsx?$/,
            use: [{
                loader: 'ts-loader',
                options: {
                    configFile: ctx.tsConfigPath
                }
            }],
            exclude: /node_modules/,
        };
    }

};
