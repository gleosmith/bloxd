import { PrintingService } from "src/services";
import { Compiler, WebpackPluginInstance, StatsCompilation, StatsError, Stats} from "webpack";


export interface BaseWebpackPlugin {
    beforeApply?(compiler?: Compiler): void;
    beforeCompile?(compilation?: any, compiler?: Compiler): void
    afterBuild?(status: 'error' | 'warn' | 'success', stats: Stats, compiler?: Compiler): void
}


export abstract class BaseWebpackPlugin implements WebpackPluginInstance {

    abstract readonly pluginName: string;

    constructor(
        public printing: PrintingService,
        public watch: boolean,
    ) {
    }

    apply(compiler: Compiler) {

        this.beforeApply?.(compiler)
        process.stdin.setRawMode(true);
        compiler.hooks.beforeCompile.tap(this.pluginName, compilation => {
            this.beforeCompile?.(compilation, compiler)
            this.loader('building modules')
        });

        compiler.hooks.done.tap(this.pluginName, stats => {

            const jsonStats = stats ? stats.toJson() || {} : {} as StatsCompilation
            const errors = jsonStats.errors || [];
            const warnings = jsonStats.warnings || [];

            if (!errors.length) {
                if (!warnings.length) {
                    this.clearLoader();
                    this.info('build completed successfully!\n')
                } else {
                    this.clearLoader();
                    this.warn('build completed with warnings!\n')
                }
                this.writeMessages(errors, warnings)
                this.afterBuild?.(warnings.length ? 'warn' : 'success', stats, compiler)
            } else {
                this.clearLoader();
                this.error('build failed!\n');
                this.writeMessages(errors, warnings);
                this.afterBuild?.('error', stats, compiler)
            }
        });
    }

    loader(text: string) {
        this.printing.initLoader(`${this.printing.green('[bloxd]', true)} ${text}`);
    }

    clearLoader() {
        this.printing.clearLoader();
    }

    info(txt: string, newLine?: boolean) {
        process.stdout.write(`${newLine ? '\n' : ''}${this.printing.green('[bloxd]', true)} ${txt}`);
    }

    warn(txt: string, newLine?: boolean) {
        process.stdout.write(`${newLine ? '\n' : ''}${this.printing.yellow('[bloxd]', true)} ${txt}`);
    }

    error(txt: string, newLine?: boolean) {
        process.stdout.write(`${newLine ? '\n' : ''}${this.printing.yellow('[bloxd]', true)} ${txt}`);
    }

    private async writeMessages(errors: StatsError[], warnings: StatsError[]) {
        if (errors.length) {
            process.stderr.write(this.printing.red('\n' + errors.map(err => `${err.message}\n${err.stack}`).join('\n'), true));
        }
        if (warnings.length) {
            process.stderr.write(this.printing.yellow('\n' + warnings.map(err => `${err.message}\n${err.stack}`).join('\n'), true));
        }
    }


}