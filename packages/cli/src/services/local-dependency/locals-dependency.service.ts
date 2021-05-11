import { PrintingService } from '../printing/printing.service';
import { spawn } from 'child_process';
import { FileService } from '../files/file.service';
import { Injectable, AppContext } from '../../../../lib/src/index';

declare var __webpack_require__: (dep: string) => any;
declare var __non_webpack_require__: (dep: string) => any

import * as path from 'path';

@Injectable()
export class LocalDependencyService {

    moduleDirectories: string[] = [];

    constructor(
        private fs: FileService,
        private app: AppContext,
        private printing: PrintingService
    ) {
        this.findNearestModules();
    }

    private findNearestModules(currentPath?: string, prevPath?: string) {
        currentPath = currentPath || process.cwd();
        if (currentPath === prevPath)
            return;
        if (this.fs.exist(path.join(currentPath, './node_modules'))) {
            this.moduleDirectories.push(path.join(currentPath, './node_modules'));
        } else {
            this.findNearestModules(path.join(currentPath, '../'), currentPath)
        }
        return this;
    }

    require(dependencyName: string) {
        const nodeRequire = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;
        let requirePath = this.find(dependencyName);
        return nodeRequire(requirePath || dependencyName)
    }

    find(dependencyName: string) {
        for (let i = 0; i < this.moduleDirectories.length; i++) {
            if (this.fs.exist(path.join(this.moduleDirectories[0], `./${dependencyName}`))) {
                return path.join(this.moduleDirectories[0], `./${dependencyName}`);
            }
        }
        return null;
    }

    async tryRunLocally() {
        let localPath = this.find(`${this.app.name}-cli`);
        if(localPath &&  path.join(localPath, './') !== this.app.cliPath) {
            let localVersion = await this.getVersion(localPath);
            if (localVersion && localVersion !== this.app.version) {
                process.stdout.write(this.printing.green('[bloxd]', true) + this.printing.white(` using your local CLI version (v${localVersion}) due to a difference to your global version (v${this.app.version})\n`, true));
                return new Promise<void>((resolve, reject) => {
                    const child = spawn('node', [path.join(localPath, `./cli.js`), ...process.argv.slice(2)], {
                        stdio: [process.stdin, process.stdout, process.stderr],
                    })
                    child.on('error', (err) => {
                        reject();
                        process.stderr.write(this.printing.red(`Error: ${err.message}\n${err.stack || ''}`, true))
                        process.exit()
                    });
                    child.on('exit', () => {
                        resolve();
                        process.exit()
                    })
                });
            }
        }
    }

    private async getVersion(dependencyPath: string) {
        if (this.fs.exist(path.join(dependencyPath, `./package.json`))) {
            return this.fs.read(path.join(dependencyPath, `./package.json`))
                .then(buf => JSON.parse(buf.toString()))
                .then(pkg => pkg.version)
        }
    }

}
