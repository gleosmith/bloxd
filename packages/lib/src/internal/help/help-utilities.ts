
import { Injectable } from '../dependency-injection/injectable-decorator';
import { CommandDescription } from '../command/command-models';
import { ModuleDescription } from '../module/module-models';
import { OptionDescription } from '../options/option-models';
import { ParameterDescription } from '../parameters/parameter-models';
import { CliBuildError } from '../common/cli-types';
import chalk = require('chalk');

/**
 * Injectable service with utility functions that assist with printing help messages
 *
 * @publicApi
 */
@Injectable()
export class HelpUtilities {

    /**
     * Creates a new instance
     */
    constructor() {
    }

    /**
     * Returns a description of a module in a single line, without details of its commands
     * @param description Description of the module, including references to its commands and parent modules
     */
    singleLineModule(
        description: ModuleDescription
    ): string {
        let output = `${this.parents(description).map(p => p.name).join(' ')}${this.parents(description).length ? ' ' : ''}`;
        output += `${description.name} <command> ${description.subCommands.length ? '[<subcommand>] ' : ''}[options] [<parameters>]`;
        return output;
    }

    /**
     * Returns a description of a module in a single line, without details of its options and parameters. It provides an optional
     * setting to include the option names in the line
     * @param command  Description of the command
     * @param dontExpandOpts Whether each option should be printed with its name else it will be printed as [options]
     */
    singleLineCommand(
        command: CommandDescription,
        dontExpandOpts: boolean
    ): string {
        let output = `${this.parents(command).map(p => p.name).join(' ')}${command.name !== '*' ? ' ' + command.name : ''}`;
        output += `${command.alias && command.name !== '*' ? ` | ${command.alias}` : ''}${command.options.length && dontExpandOpts ? ' [options]' : ''}`;
        if (!dontExpandOpts && command.options.length) {
            command.options.forEach(o =>
                output += ` ${o.required ? '' : '['}--${o.name}${o.designType === Boolean ? '' : '=<value>'}${o.required ? '' : ']'}`
            );
        }
        command.parameters
            .sort((a, b) => a.index > b.index ? 1 : -1)
            .forEach((param) => output += ` ${param.optional ? '[' : ''}<${param.isArray ? '...' : ''}${param.name}>${param.optional ? ']' : ''}`);
        return output;
    }

    /**
     * Returns the descriptions of all parent modules for a particular module or command
     * @param description Description of the command or module
     */
    private parents(
        description: ModuleDescription | CommandDescription
    ): ModuleDescription[] {
        const parents: ModuleDescription[] = [];
        let parent = description.parent;
        while (parent) {
            parents.push(parent);
            parent = parent.parent;
        }
        const reversed: ModuleDescription[] = [];
        parents.forEach((p, i, all) => reversed.push(all[all.length - 1 - i]));
        return reversed;
    }

    /**
     * Prints a table with equal tabs for columns
     * @param textMatrix Table to print as a two dimensional array
     * @param maxLengths Maximum character length for a column, after which the text is wrapped
     */
    table(
        textMatrix: string[][],
        maxLengths?: number[]
    ): string {

        const numSpaces = 4;
        if (maxLengths) {
            if (maxLengths.length !== textMatrix.length) {
                throw new CliBuildError('PrintingUtils: the max column defintions are not the same dimensions as the table');
            }
            this.applyMaxColumnLengths(textMatrix, maxLengths);
        }

        let output = '';
        textMatrix = textMatrix.filter(col => col.filter(val => !!val.length).length > 0);
        const columnLengths = textMatrix.map(column => column.reduce((prev, cur) => cur.length > prev ? cur.length : prev, 0));

        textMatrix[0].forEach((value, rowIndex) => {
            output += '\n';
            columnLengths.forEach((length, colIndex, cols) => {
                output += `${textMatrix[colIndex][rowIndex] + Array(length - textMatrix[colIndex][rowIndex].length).fill(' ').join('')} `;
                output += colIndex < cols.length - 1 ? Array(numSpaces).fill(' ').join('') : '';
            });
        });
        return output;
    }

    /**
     * Modifies a two dimensional table matrix and inserts new rows for columns that exceed the maximum number of characters
     * @param textMatrix Original table matrix
     * @param maxLengths  Maximum character length for a column, after which the text is wrapped
     */
    private applyMaxColumnLengths(
        textMatrix: string[][],
        maxLengths: number[]
    ) {
        for (let rowIndex = 0; rowIndex < textMatrix[0].length; rowIndex++) {
            const values: string[][] = [];
            maxLengths.forEach((maxLength, colIndex) => {
                if (maxLength) {
                    if (textMatrix[colIndex][rowIndex].length > maxLength) {
                        values.push(this.splitTextForTable(textMatrix[colIndex][rowIndex], maxLength));
                    } else {
                        values.push([textMatrix[colIndex][rowIndex]]);
                    }
                } else {
                    values.push([textMatrix[colIndex][rowIndex]]);
                }
            });
            const rows = values.reduce((prev, cur) => cur.length > prev ? cur.length : prev, 0);
            if (rows > 1) {
                for (let newRowIndex = 0; newRowIndex < rows; newRowIndex++) {
                    values.forEach((val, col) => textMatrix[col].splice(rowIndex + newRowIndex, newRowIndex === 0 ? 1 : 0, val[newRowIndex] || ''));
                }
            }
        }
    }

    /**
     * Splits a column up into multiple rows to wrap the column's text
     * @param text text to split
     * @param maxLength Maximum number of characters per column before text-wrapping is applied
     */
    private splitTextForTable(
        text: string,
        maxLength: number
    ) {
        let remainingText = text;
        const textPieces = [];
        while (remainingText.length) {
            textPieces.push(remainingText.substring(0, maxLength).trimLeft());
            remainingText = remainingText.substring(maxLength, remainingText.length);
        }
        return textPieces;
    }

    /**
     * Returns a description of the parameters for a particular command, including descriptions
     * @param parameters Descriptions of the command's parameters
     */
    commandParameters(
        parameters: ParameterDescription[]
    ): string {
        let output = chalk.whiteBright(`\n\nParameters:`);
        const paramatersTable: string[][] = [[], []];
        parameters
            .sort((a, b) => a.index > b.index ? 1 : -1)
            .forEach((param) => {
                paramatersTable[0].push(`${param.optional ? '[' : ''}<${param.isArray ? '...' : ''}${param.name}>${param.optional ? ']' : ''}`);
                paramatersTable[1].push(param.description || 'No description avaliable');
            });
        output += this.table(paramatersTable, [null, 200]);
        return output;
    }

    /**
     * Returns a description of the options for a particular command, including descriptions
     * @param options Descriptions of the command's options
     */
    commandOptions(
        options: OptionDescription[]
    ): string {
        let output = chalk.whiteBright(`\n\nOptions:`);
        const optionsTable: string[][] = [[], [], [], []];
        options
            .sort((a, b) => a.name > b.name ? 1 : -1)
            .forEach((opt) => {
                optionsTable[0].push(`--${opt.name}${opt.alias ? `, -${opt.alias}` : ``}`);
                optionsTable[1].push(opt.designType !== Boolean ? '<value>' : '');
                optionsTable[2].push(opt.required ? '*required' : '');
                optionsTable[3].push(opt.description || 'No description avaliable');
            });
        output += this.table(optionsTable, [null, null, null, 100]);
        return output;
    }

    /**
     * Prints a description for all commands in a module
     * @param commands Descriptions of the module's commands
     * @param subCommands Descriptions of the module's subcommands
     */
    moduleCommands(
        commands: CommandDescription[],
        subCommands: ModuleDescription[]
    ): string {
        let output = chalk.whiteBright(`\n\nCommands:`);
        const commandsTable: string[][] = [[], []];
        [...commands, ...subCommands]
            .filter(c => c.name !== '*')
            .sort((a, b) => a.name > b.name ? 1 : -1)
            .forEach((command) => {
                commandsTable[0].push(`${command.name}${command.alias ? `, ${command.alias}` : ''}`);
                commandsTable[1].push(command.description || 'No description avaliable');
            });

        return output += this.table(commandsTable, [null, 120]);
    }


}
