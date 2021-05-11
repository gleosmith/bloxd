import { CliOptions, CliOption } from '../../../../../../lib/src/index';

@CliOptions()
export class ServiceSchematicsOptions {

    @CliOption({
        alias: 'g',
        description: 'whether the service should be declared as global'
    })
    global = false;

    @CliOption({
        alias: 's',
        description: 'whether the service should not be a singleton service'
    })
    notSingleton = false;

}
