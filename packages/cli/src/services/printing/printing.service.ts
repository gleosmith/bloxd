import { Injectable } from '../../../../lib/src/index';
import * as chalk from 'chalk';
import * as readline from 'readline';
import * as ora from 'ora'

@Injectable()
export class PrintingService {

    interval: any;

    private spinner: ora.Ora
    private spinnerTxt: string;

    constructor() { }

    writeLine(text: string) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0, null);
        process.stdout.write(text);
    }

    initLoader(text: string) {
        this.spinnerTxt = text;
        this.spinner = ora({ prefixText: text, spinner: { frames: ['\\', '|', '/', '-'] }, color: 'white'}).start()
    }

    clearLoader() {
        if(this.spinner) {
            this.spinner.stop()
            this.writeLine('')
            this.spinner = null;
        }
    }

    red(text: string, bold = false) {
        return bold ? chalk.bold.red(text) : chalk.red(text);
    }

    green(text: string, bold = false) {
        return bold ? chalk.bold.green(text) : chalk.green(text);
    }

    yellow(text: string, bold = false) {
        return bold ? chalk.bold.yellow(text) : chalk.yellow(text);
    }

    white(text: string, bold = false) {
        return bold ? chalk.bold.white(text) : chalk.white(text);
    }

    gray(text: string, bold = false) {
        return bold ? chalk.bold.gray(text) : chalk.gray(text);
    }


}
