import { RunWebpackPlugin } from './run.plugin';
import { Command, CliCommand, AppContext, CliParameter } from '../../../../lib/src/index';
import { PrintingService } from '../../services';
import { BaseBuildCommand, BuildOptions, BuildContext } from '../../shared/build';
import { RunOptions } from './run.options';

@CliCommand('run', {
    alias: 'r',
    description: 'builds and runs the CLI app with arguments',
    options: [BuildOptions, RunOptions],
    providers: [
        BuildContext
    ]
})
export class RunCommand extends BaseBuildCommand implements Command {

    @CliParameter(1, {
        optional: true,
        description: 'arguments to supply into your cli command'
    })
    argsString: string = '';

    constructor(
        private printService: PrintingService,
        private runOptions: RunOptions,
        buildContext: BuildContext<RunCommand>
    ) {
        super(printService, buildContext)
    }

    getWebpackPlugins() {
        return [
            {
                resolve(ctx: BuildContext<RunCommand>) {
                    return new RunWebpackPlugin(ctx.command.printService, ctx.watch, ctx, ctx.command.runOptions, ctx.command.argsString)
                }
            }
        ]
    }


}
