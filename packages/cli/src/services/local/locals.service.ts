import { PrintingService } from './../printing/printing.service';
import { spawn } from 'child_process';
import { FileService } from './../files/file.service';
import { Injectable, AppContext } from '../../../../lib/src/index';
import * as path from 'path';

@Injectable()
export class LocalsService {

    nodeModulesDirectory: string = '';
    isLocal = false;

    constructor(
        private fs: FileService,
        private app: AppContext,
        private printing: PrintingService
    ) { }



    async runLocally() {
        this.findLocalProject();
        let localVersion = await this.localCliVersion();
        if (localVersion && !this.isLocal) {
            process.stdout.write(this.printing.green('[bloxd]', true) + this.printing.white(` using your local CLI version (v${localVersion}) due to a difference to your global version (v${this.app.version})\n`, true));
            return new Promise<void>((resolve, reject) => {
                const child = spawn('node', [path.join(this.nodeModulesDirectory, `./${this.app.name}-cli/cli.js`), ...process.argv.slice(2)], {
                    stdio: [process.stdin, process.stdout, process.stderr],
                })
                child.on('error', (err) => {
                    process.stderr.write(this.printing.red(`Error: ${err.message}\n${err.stack || ''}`, true))
                    process.exit()
                });
                child.on('exit', () => {
                    reject();
                    process.exit()
                })
            });
        }
    }

    private findLocalProject(currentPath?: string, prevPath?: string) {
        currentPath = currentPath || process.cwd();
        if (currentPath === prevPath)
            return;
        if (this.fs.exist(path.join(currentPath, './package.json'))) {
            this.nodeModulesDirectory = this.fs.exist(path.join(currentPath, './node_modules')) ? path.join(currentPath, './node_modules') : '';
            this.isLocal = currentPath === this.app.nodePath;
        } else {
            this.findLocalProject(path.join(currentPath, '../'), currentPath)
        }
        return this;
    }

    private async localCliVersion() {
        if (this.nodeModulesDirectory) {
            if (this.fs.exist(path.join(this.nodeModulesDirectory, `./${this.app.name}-cli`))) {
                return this.fs.read(path.join(this.nodeModulesDirectory, `./${this.app.name}-cli/package.json`))
                    .then(buf => JSON.parse(buf.toString()))
                    .then(pkg => pkg.version)
            }
        }
        return null
    }


}
