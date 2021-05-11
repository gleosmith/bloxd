import { CliOption, CliOptions } from '../../../../lib/src/index';
import { FilePath } from './../../../../lib/src/internal/parser/additional-types';


@CliOptions()
export class RunOptions {

    @CliOption({
        alias: 'c',
        description: 'current working directory to run the application from'
    })
    cwd: FilePath

}