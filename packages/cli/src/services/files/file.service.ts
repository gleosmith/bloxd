import * as fs from 'fs';
import { Injectable } from '../../../../lib/src/index';
import * as path from 'path';

export interface FileMatch {
    directory: string;
    fileName: string;
}

@Injectable()
export class FileService {

    constructor() {
    }

    async read(dir: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            fs.readFile(dir, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    async write(dir: string, content: string | Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(dir, content, {}, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    newFolder(dirName: string) {
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }
    }

    exist(dirName: string) {
        return fs.existsSync(dirName);
    }

    isFolder(dir: string) {
        return fs.lstatSync(dir).isDirectory();
    }

    readDir(dir: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async locateParent(currentDirectory: string, parentName: string): Promise<FileMatch> {
        const dirs = await this.readDir(currentDirectory);
        let parent: FileMatch;

        dirs.forEach(dir => {
            if (!parent) {
                parent = dir.indexOf(parentName) === -1 ? null : {
                    directory: currentDirectory,
                    fileName: dir
                };
            }
        });

        if (!parent) {
            if (currentDirectory === path.join(currentDirectory, './../')) {
                return null;
            }
            return await this.locateParent(path.join(currentDirectory, './../'), parentName);
        }
        return parent;
    }

}
