const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const PackagePlugin = require('./webpack.package-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const config = {
    entry: './src/main.ts',
    target: 'node',
    externals: {
        'webpack': 'commonjs webpack',
        'webpack-merge': 'commonjs webpack-merge',
        'copy-webpack-plugin': 'commonjs copy-webpack-plugin',
        'circular-dependency-plugin': 'commonjs circular-dependency-plugin'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: path.join(__dirname, './tsconfig.json')
                    }
                }],
                exclude: /node_modules/,

            },
            {
                test: /\.template$/i,
                use: 'raw-loader'
            }
        ],
    },
    plugins: [
        new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
        new webpack.DefinePlugin({
            __BLOXD_CLI_NAME__: JSON.stringify('bloxd'),
            __BLOXD_CLI_VERSION__: JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, './package.json')).toString()).version)
        }),
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            include: /src/,
            failOnError: false,
            allowAsyncCycles: false,
            cwd: process.cwd(),
        }),
        new CopyPlugin({
            patterns: [
                { from: path.join(__dirname, '../../README.md'), to: path.join(__dirname, './dist/') },
                { from: path.join(__dirname, '../../LICENSE'), to: path.join(__dirname, './dist/') }
            ],
        }),
        new PackagePlugin({
            file: './package.json',
            outputDir: './dist',
            package: {
                bin: {
                    bloxd: './cli.js'
                }
            }
        }),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        plugins: [
            new TsconfigPathsPlugin({ configFile: './tsconfig.json', baseUrl: './' }),
        ]
    },
    output: {
        filename: 'cli.js',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    }
}

module.exports = (env, argv) => {
    if (env.production) {
        config.mode = 'production'
        config.optimization = {
            minimizer: [new TerserPlugin({
                extractComments: false,
            })],
        };
    } else {
        config.mode = 'development'
        config.devtool = 'source-map'
    }
    return config;
}