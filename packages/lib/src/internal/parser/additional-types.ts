import * as path from 'path';

/**
 * A special type for parameter properties, decorated with`@CliParameter()`, and option properties, decorated with `@CliOption()`.
 * This type can be validated by the default type casting implementation, ensuring that an integer is bound to the decorated property.
 * For all other uses, this type is a simple extension of the primitive number type and therefore provides no additional validation.
 *
 * ### EXAMPLE
 * ```ts
 * @Command('clone')
 * export class CloneCommand implements Command {
 *
 *  @CliParameter(1) type: Int
 *  ...
 * }
 * ```
 * @publicApi
 */
export class Int extends Number {
    constructor(val: any) {
        super(val);
    }
}

/**
 * A special type for parameter properties, decorated with`@CliParameter()`, and option properties, decorated with `@CliOption()`.
 * This type can be validated and parsed by the default type casting and parsing implementation, ensuring that a valid directory or file path
 * is bound to the decorated property. If invalid, an error will be thrown which is caught by the help module if implemented. If valid, the bound property will
 * contain both the absolute and relative file paths.
 *
 * ### EXAMPLE
 * ```ts
 * @Command('clone')
 * export class CloneCommand implements Command {
 *
 *  @CliParameter(1) dir: FilePath
 *
 *   execute() {
 *     fs.readdirSync(this.dir.absolute);
 *   }
 *
 * }
 * ```
 * @publicApi
 */
export class FilePath {

    /**
     * File/directory path relative the cwd
     */
    relative: string;

    /**
     * Absolute file/directory path
     */
    absolute: string;

    /**
     * creates a new instance
     */
    constructor(filePath: string, cwd: string) {
        if (path.isAbsolute(filePath)) {
            this.absolute = filePath;
            this.relative = path.relative(cwd, filePath);
        } else {
            this.relative = filePath;
            this.absolute = path.join(cwd, filePath);
        }
    }

}
