const fs = require('fs')
const path = require('path')
const utils = require('schema-utils');

// schema for options object
const schema = {
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

module.exports = class PackagePlugin {


    constructor(opts) {
        utils.validate(schema, opts, 'PackagePlugin')
        this.options = opts;
    }

    apply(compiler) {
        compiler.hooks.done.tap('PackagePlugin', compilation => {
            fs.writeFileSync(
                path.join(__dirname, this.options.outputDir, './package.json'),
                JSON.stringify({
                    ...JSON.parse(fs.readFileSync(path.join(__dirname, this.options.file))),
                    ...this.options.package
                }, null, 4))
        });
    }
}
