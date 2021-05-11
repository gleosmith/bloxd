import { ConsoleInput } from './../../shared/build/webpack/console-input';
import { BuildContext } from './../../shared/build/build-context';
import { PrintingService } from './../../services/printing/printing.service';
import { BaseWebpackPlugin } from './../../shared/build';
import { ChildProcess, spawn } from 'child_process';
import { emitKeypressEvents } from 'readline';
import stringArgv from 'string-argv';
import { RunOptions } from './run.options';

export class RunWebpackPlugin extends BaseWebpackPlugin {

    readonly pluginName = 'BloxdRunnerPlugin';

    private child: ChildProcess;
    private changeCounter = 0;
    private input: ConsoleInput;
    isListeningForArgs = false;


    constructor(
        printing: PrintingService,
        watch: boolean,
        private buildContext: BuildContext<any>,
        private runOptions: RunOptions,
        private argsString: string
    ) {
        super(printing, watch)
    }


    beforeApply() {
        this.changeCounter = 0;
        if (this.watch) {

            const writer = new ConsoleInput(`${this.printing.green('[bloxd]', true)} enter new CLI args: `, 28, this.argsString, (txt) => {
                this.argsString = txt;
                this.runCommand();
            });
            emitKeypressEvents(process.stdin);

            process.stdin.on('keypress', (str, key) => {
                if (key.ctrl && key.name === 'c') {
                    process.exit()
                } else if (key.name === 'up' && this.isListeningForArgs) {
                    if (!writer.isActive) {
                        writer.activate();
                    } else {
                        writer.handleKey(str, key);
                    }
                } else if (this.isListeningForArgs) {
                    writer.handleKey(str, key);
                }
            })
        }
    }

    beforeCompile() {
        this.kill();
        if (this.changeCounter > 0) {
            this.info(`detected changes\n`, true)
        }
        this.changeCounter++;
    }

    afterBuild(status: string) {
        if (status === 'error') {
            if (this.watch) {
                this.error('waiting for code changes (or press up key to change args)....', true)
                this.resetInputStream();
            }
        } else {
            this.runCommand()
        }
    }

    private runCommand() {
        this.kill();
        const args = stringArgv(this.argsString);
        this.info(`executing command: ${this.printing.gray(`${this.buildContext.name}${this.argsString.length ? ' ' : ''}${this.argsString.trim()}`, true)}`)
        process.stdout.write(`\n--------------------------------------->\n`);
        this.child = spawn('node', [`${this.buildContext.outputDir}/${this.buildContext.outputName}.js`.replace('//', '/'), ...args], {
            stdio: [process.stdin, process.stdout, process.stderr],
            cwd: this.runOptions.cwd ? this.runOptions.cwd.absolute : process.cwd()
        });
        this.child.on('exit', () => {
            if (this.watch) {
                this.info('command executed, waiting for code changes (or press up key to change args)....', true)
                this.resetInputStream();
            }
        });
    }

    private resetInputStream() {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        this.isListeningForArgs = true;
    }

    private kill() {
        if (this.input) {
            this.input.deactivate();
        }

        if (this.child) {
            this.child.kill()
        }
        this.child = null;

        this.isListeningForArgs = false;
        process.stdin.pause();
    }

}