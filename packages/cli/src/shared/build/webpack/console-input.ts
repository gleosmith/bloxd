import { clearLine, cursorTo } from "readline";

export class ConsoleInput {

    private writtenText: string = '';
    private isActiveVal = false;
    private cursor: number;
    private length = 0;
    private history = []
    private historyIndex = -1;

    get isActive() {
        return this.isActiveVal
    }

    set isActive(val: boolean) {
        this.isActiveVal = val;
    }

    constructor(
        private baseText: string,
        private baseCurosrPos: number,
        private firstHistory: string,
        private cb: (txt: string) => void,
    ) {
        this.history.push(firstHistory.trim())
    }


    private show() {
        process.stdout.write('\n')
        process.stdout.write(this.baseText || '')
        this.cursor = 0;
        this.length = 0;
        cursorTo(process.stdout, this.baseCurosrPos)
    }

    addToHistory() {
        this.history = this.history.reduce((prev, hst) => {
            if(prev.indexOf(hst) === -1 && hst !== this.writtenText) {
                prev.push(hst)
            }
            return prev;
        }, []);
        this.history.splice(50, this.history.length);
        this.history.splice(0, 0, this.writtenText)
    }

    activate() {
        this.historyIndex = -1;
        if (!this.isActive) {
            this.show()
        }
        this.isActiveVal = true;
        this.keyup()
    }

    deactivate() {
        if (this.isActive) {
            process.stdout.write('\n')
        }
        this.isActiveVal = false;
    }


    handleKey(str: string, key: any) {
        if (this.isActive) {
            switch (key.name) {
                case 'backspace':
                    this.backspace();
                    break;
                case 'delete':
                    this.delete();
                    break;
                case 'left':
                    this.cusorBack();
                    break;
                case 'right':
                    this.cusorForward();
                    break;
                case 'up':
                    this.keyup();
                    break;
                case 'down':
                    this.keydown();
                    break;
                case 'return':
                    this.deactivate();
                    this.writtenText = this.writtenText.trim();
                    this.addToHistory();
                    this.cb(this.writtenText);
                    break;
                default:
                    if (str && str.length === 1) {
                        if (this.cursor < this.length) {
                            clearLine(process.stdout, 1)
                            process.stdout.write(str + this.writtenText.substring(this.cursor, this.writtenText.length))
                            this.writtenText = this.writtenText.substring(0, this.cursor) + str + this.writtenText.substring(this.cursor, this.writtenText.length)
                        } else {
                            process.stdout.write(str);
                            this.writtenText += str;
                        }
                        this.length++;
                        this.cursor++;
                        cursorTo(process.stdout, this.cursor + this.baseCurosrPos)
                    }
            }
        }
    }


    private selectHistoryItem() {
        cursorTo(process.stdout, this.baseCurosrPos);
        clearLine(process.stdout, 1);
        process.stdout.write(this.history[this.historyIndex]);
        this.writtenText = this.history[this.historyIndex];
        this.cursor = this.history[this.historyIndex].length;
        this.length = this.history[this.historyIndex].length;
        cursorTo(process.stdout, this.cursor + this.baseCurosrPos);
    }

    private keyup() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.selectHistoryItem();
        }
    }

    private keydown() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.selectHistoryItem();
        } else if (this.historyIndex !== -1) {
            this.historyIndex = -1;
            this.writtenText = '';
            cursorTo(process.stdout, this.baseCurosrPos);
            clearLine(process.stdout, 1);
            this.length = 0;
            this.cursor = 0;
        }
    }

    private cusorForward() {
        if (this.cursor < this.length) {
            this.cursor = Math.min(this.cursor + 1, this.length);
            cursorTo(process.stdout, this.cursor + this.baseCurosrPos)
        }
    }

    private delete() {
        if (this.cursor < this.length) {
            clearLine(process.stdout, 1);
            process.stdout.write(this.writtenText.substring(this.cursor, this.writtenText.length - 1));
            this.writtenText = this.writtenText.substring(0, this.cursor) + this.writtenText.substring(this.cursor, this.writtenText.length - 1);
            this.length--;
            cursorTo(process.stdout, this.cursor + this.baseCurosrPos)
        }
    }

    private backspace() {
        if (this.cursor > 0) {
            this.cusorBack()
            clearLine(process.stdout, 1);
            process.stdout.write(this.writtenText.substring(this.cursor + 1, this.writtenText.length));
            this.writtenText = this.writtenText.substring(0, this.cursor) + this.writtenText.substring(this.cursor + 1, this.writtenText.length);
            this.length--;
            cursorTo(process.stdout, this.cursor + this.baseCurosrPos)
        }
    }

    private cusorBack() {
        if (this.cursor > 0) {
            this.cursor = Math.max(this.cursor - 1, 0);
            cursorTo(process.stdout, this.cursor + this.baseCurosrPos)
        }
    }

}