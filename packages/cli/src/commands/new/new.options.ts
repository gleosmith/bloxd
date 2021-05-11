import { CliOptions, CliOption } from '../../../../lib/src/index';

@CliOptions()
export class NewOptions {

    @CliOption({
        alias: 'w',
        description: 'include the extended webpack config for customization'
    })
    webpack = false;

}
