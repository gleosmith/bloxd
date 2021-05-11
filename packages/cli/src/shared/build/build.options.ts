import { CliOption, CliOptions, FilePath } from '../../../../lib/src/index';

@CliOptions()
export class BuildOptions {

    @CliOption({
        alias: 'p',
        description: 'Whether the bundled app is minified and source maps are removed'
    })
    prod: boolean;

    @CliOption({
        alias: 'w',
        description: 'Whether the app is rebuilt when a source file changes'
    })
    watch: boolean;

    @CliOption({
        alias: 'n',
        description: 'Sets the cli name'
    })
    name: string;

    @CliOption({
        alias: 'V',
        description: 'Sets the cli version'
    })
    buildVersion: string;

    @CliOption({
        description: 'path of project\'s root directory',
        alias: 'P'
    })
    path: FilePath;

}
