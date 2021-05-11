import { Command, CliCommand, AppContext } from '../../../../lib/src/index';
import { PrintingService } from '../../services';
import { BaseBuildCommand, BuildOptions, BuildContext } from '../../shared/build';
import { BuildWebpackPlugin } from './build.plugin';

@CliCommand('build', {
    alias: 'b',
    description: 'builds the CLI app',
    options: [BuildOptions],
    providers: [
        BuildContext
    ]
})
export class BuildCommand extends BaseBuildCommand implements Command {

    constructor(
        private printService: PrintingService,
        buildContext: BuildContext<BuildCommand>,
    ) {
        super(printService, buildContext)
    }

    getWebpackPlugins() {
        return [
            {
                resolve(ctx: BuildContext<BuildCommand>) {
                    return new BuildWebpackPlugin(ctx.command.printService, ctx.watch)
                }
            }
        ]
    }

}
