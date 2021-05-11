import { CliOption, CliOptions } from '../../../../../../lib/src/index';

@CliOptions()
export class CommandSchematicsOptions {

    @CliOption({
        alias: 'a',
        description: 'the command\'s alias'
    })
    alias = '';

    @CliOption({
        alias: 'd',
        description: 'a description of the command'
    })
    description = '';

}
