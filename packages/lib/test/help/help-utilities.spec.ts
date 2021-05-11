import { ModuleDescription } from '../../src/internal/module/module-models';
import { createModuleDescription, createParameterDescription, createCommandDescription, createOptionDescription } from '../shared';
import { HelpUtilities, OptionDescription, ParameterDescription, CommandDescription } from '../../src';
import * as chalk from 'chalk';

describe('HelpUtilities[class]', () => {

    let moduleDescription: ModuleDescription;
    let helpUtils: HelpUtilities;
    beforeEach(() => {
        helpUtils = new HelpUtilities();
        moduleDescription = {
            ...createModuleDescription({ name: 'cli', description: 'cli description' }),
            commands: [
                {
                    ...createCommandDescription({ name: 'cmd1', description: 'c1 description' }),
                    options: [
                        createOptionDescription({ name: 'opt1', alias: 'o1', description: 'o1 description', designType: Boolean }),
                        createOptionDescription({ name: 'opt2', description: 'o2 description' })
                    ],
                    parameters: [
                        createParameterDescription({ name: 'param1', description: 'p1 description', index: 2 }),
                        createParameterDescription({ name: 'param2', description: 'p2 description', index: 1 }),
                    ]
                },
                createCommandDescription({ name: 'cmd2', description: 'c2 description' }),
            ],
            subCommands: [
                {
                    ...createModuleDescription({ name: 'sub1', alias: 's1', description: 's1 description' }),
                    commands: [
                        {
                            ...createCommandDescription({ name: 'cmd3', alias: 'c3', description: 'c3 description' }),
                            options: [
                                createOptionDescription({ name: 'opt3', alias: 'o3', description: 'o3 description' }),
                            ],
                            parameters: [
                                createParameterDescription({ name: 'param1', description: 'p1 description', index: 1 }),
                            ]
                        }
                    ]
                }
            ]
        };
        [...moduleDescription.commands, ...moduleDescription.subCommands].forEach(child => child.parent = moduleDescription);
        moduleDescription.subCommands.forEach(subModule =>
            [...subModule.commands, ...subModule.subCommands].forEach(child => child.parent = subModule)
        );
    });

    describe('singleLineModule()', () => {

        it('Should print the module name with indicating it has commands, subcommands, options and parameters', () => {
            expect(helpUtils.singleLineModule(moduleDescription)).toBe('cli <command> [<subcommand>] [options] [<parameters>]');
        });

        it('Should not show that it has subcommand if it is not applicable', () => {
            moduleDescription.subCommands = [];
            expect(helpUtils.singleLineModule(moduleDescription)).toBe('cli <command> [options] [<parameters>]');
        });

        it('Should append the parent module names before the module name if applicable', () => {
            expect(helpUtils.singleLineModule(moduleDescription.subCommands[0]).startsWith('cli sub1')).toBe(true);
        });


    });

    describe('singleLineCommand()', () => {

        it('Should start with the parent module names and the cli name', () => {
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], true).startsWith('cli cmd1')).toBe(true);
            expect(helpUtils.singleLineCommand(moduleDescription.subCommands[0].commands[0], true).startsWith('cli sub1 cmd3')).toBe(true);
        });

        it('Should not include the command name when the command is a star command', () => {
            moduleDescription.commands[0].name = '*';
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], true).startsWith('cli cmd1')).toBe(false);
        });

        it('Should not include the command name when the command is a star command', () => {
            moduleDescription.commands[0].name = '*';
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], true).startsWith('cli cmd1')).toBe(false);
        });

        it('Should include | {alias} after the command name if the command has an alias', () => {
            moduleDescription.commands[0].alias = 'c';
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], true).startsWith('cli cmd1 | c')).toBe(true);
        });

        it('Should not include | {alias} after the command name if the command does not have alias or it is a start command', () => {
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], true).startsWith('cli cmd1 | c')).toBe(false);
            moduleDescription.commands[0].alias = 'c';
            moduleDescription.commands[0].name = '*';
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], true).startsWith('cli cmd1 | c')).toBe(false);
        });

        it('Should end with the parameters sorted by index', () => {
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], false).endsWith('<param2> <param1>')).toBe(true);
        });

        it('Should enclose optional parameters in square brackets', () => {
            moduleDescription.commands[0].parameters[0].optional = true;
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], false).endsWith('<param2> [<param1>]')).toBe(true);
        });

        it('Should not print anything for options if the command does not have options', () => {
            moduleDescription.commands[0].options = [];
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], true)).toBe('cli cmd1 <param2> <param1>');
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], false)).toBe('cli cmd1 <param2> <param1>');
        });

        it('Should print the command options as [options] when the expandOptions argument is false and the command has options', () => {
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], true).startsWith('cli cmd1 [options]')).toBe(true);
        });

        it('Should print a description for each option, using their name prefixed with -- and appending =<value> to the end of the option if it is not a boolean option', () => {
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], false)).toBe('cli cmd1 [--opt1] [--opt2=<value>] <param2> <param1>');
        });

        it('Should not wrap printed options in square brackets if the option is required', () => {
            moduleDescription.commands[0].options[1].required = true;
            expect(helpUtils.singleLineCommand(moduleDescription.commands[0], false)).toBe('cli cmd1 [--opt1] --opt2=<value> <param2> <param1>');
        });

    });

    describe('table()', () => {
        let tableData: string[][];
        beforeEach(() => {

            tableData = [
                ['value', 'v'],
                ['value value', 'value value val'],
                ['value value value value', 'value value'],
            ];
        });

        it('Should throw an error when the table column dimensions are not the same as the max length dimensions', () => {
            expect(() => helpUtils.table(tableData, [null])).toThrowError();
            expect(() => helpUtils.table(tableData, [null, null, null, null])).toThrowError();
        });

        it('Should start on a new line', () => {
            expect(helpUtils.table(tableData, [null, null, null]).startsWith('\n')).toBeTrue();
        });

        it('Should return a table with equal tabs from the largest string in each column, not applying max column lenghts from null values', () => {
            const rows = helpUtils.table(tableData, [null, null, null]).split('\n').filter(row => !!row);
            expect(rows[0]).toEqual('value     value value         value value value value ');
            expect(rows[1]).toEqual('v         value value val     value value             ');
        });

        it('Should ignore columns that all have empty values', () => {
            tableData[1][0] = '';
            tableData[1][1] = '';
            const rows = helpUtils.table(tableData, [null, null, null]).split('\n').filter(row => !!row);
            expect(rows[0]).toEqual('value     value value value value ');
            expect(rows[1]).toEqual('v         value value             ');
        });

        it('Should wrap columns when the text length exceeds the max column length', () => {

            const rows = helpUtils.table(tableData, [null, 6, 10]).split('\n').filter(row => !!row);
            expect(rows[0]).toEqual('value     value      value valu ');
            expect(rows[1]).toEqual('          value      e value va ');
            expect(rows[2]).toEqual('                     lue        ');
            expect(rows[3]).toEqual('v         value      value valu ');
            expect(rows[4]).toEqual('          value      e          ');
            expect(rows[5]).toEqual('          val                   ');
        });

    });

    describe('commandOptions()', () => {

        let spy: jasmine.Spy<(data: string[][], maxColumns: number[]) => string>;
        let options: OptionDescription[] = [];
        beforeEach(() => {
            spy = spyOn(helpUtils, 'table').and.returnValue('\n#TABLE-RESULT');
            options = moduleDescription.commands[0].options;
        });

        it('Should return the title Options: on a new line together with the table result', () => {
            expect(helpUtils.commandOptions(options)).toContain(`#TABLE-RESULT`);
        });

        it('Should place the option name, and alias (if applicable) as the first column of the table', () => {
            helpUtils.commandOptions(options);
            expect(spy.calls.mostRecent().args[0][0][0]).toEqual('--opt1, -o1');
            expect(spy.calls.mostRecent().args[0][0][1]).toEqual('--opt2');
        });

        it('Should sort the options by name', () => {
            options[0].name = 'b';
            options[0].alias = undefined;
            options[1].name = 'a';
            options[1].alias = undefined;
            helpUtils.commandOptions(options);
            expect(spy.calls.mostRecent().args[0][0][0]).toEqual('--a');
            expect(spy.calls.mostRecent().args[0][0][1]).toEqual('--b');
        });

        it('Should place the <value> in the second column if they option does not have a boolean designType', () => {
            helpUtils.commandOptions(options);
            const x = spy.calls.mostRecent();
            expect(spy.calls.mostRecent().args[0][1][0]).toEqual('');
            expect(spy.calls.mostRecent().args[0][1][1]).toEqual('<value>');
        });

        it('Should place the *required in the third column if the option is required', () => {
            options[0].required = true;
            helpUtils.commandOptions(options);
            expect(spy.calls.mostRecent().args[0][2][0]).toEqual('*required');
            expect(spy.calls.mostRecent().args[0][2][1]).toEqual('');
        });

        it('Should place the option\'s description in the fourth column with a placeholder if the option does not have a description', () => {
            options[0].description = 'A description';
            options[1].description = undefined;
            helpUtils.commandOptions(options);
            expect(spy.calls.mostRecent().args[0][3][0]).toEqual('A description');
            expect(spy.calls.mostRecent().args[0][3][1]).toEqual('No description avaliable');
        });


    });


    describe('commandParameters()', () => {

        let spy: jasmine.Spy<(data: string[][], maxColumns: number[]) => string>;
        let params: ParameterDescription[] = [];
        beforeEach(() => {
            spy = spyOn(helpUtils, 'table').and.returnValue('\n#TABLE-RESULT');
            params = moduleDescription.commands[0].parameters;
        });

        it('Should return the title Parameters: on a new line together with the table result', () => {
            expect(helpUtils.commandParameters(params)).toContain(`#TABLE-RESULT`);
        });

        it('Add the parameter name (sorted by name) in the first column and should wrap the name in square brackets if it is optional', () => {
            params[1].optional = true;
            helpUtils.commandParameters(params);
            expect(spy.calls.mostRecent().args[0][0][0]).toEqual('[<param2>]');
            expect(spy.calls.mostRecent().args[0][0][1]).toEqual('<param1>');
        });

        it('Should place the parameters\'s description in the second column with a placeholder if the parameter does not have a description', () => {
            params[0].description = 'A description';
            params[1].description = undefined;
            helpUtils.commandParameters(params);
            expect(spy.calls.mostRecent().args[0][1][0]).toEqual('No description avaliable');
            expect(spy.calls.mostRecent().args[0][1][1]).toEqual('A description');
        });

    });

    describe('moduleCommands()', () => {

        let spy: jasmine.Spy<(data: string[][], maxColumns: number[]) => string>;
        let commands: CommandDescription[] = [];
        let subcommands: ModuleDescription[] = [];
        beforeEach(() => {
            spy = spyOn(helpUtils, 'table').and.returnValue('\n#TABLE-RESULT');
            commands = moduleDescription.commands;
            subcommands = moduleDescription.subCommands;
        });

        it('Should return the title Commands: on a new line together with the table result', () => {
            expect(helpUtils.moduleCommands(commands, subcommands)).toContain(`#TABLE-RESULT`);
        });

        it('Should place the command or subcommand name in the first column with the alias if applicable', () => {
            commands[0].alias = 'c1';
            commands[1].alias =  undefined;
            helpUtils.moduleCommands(commands, subcommands);
            const x = spy.calls.mostRecent();
            expect(spy.calls.mostRecent().args[0][0][0]).toEqual('cmd1, c1');
            expect(spy.calls.mostRecent().args[0][0][1]).toEqual('cmd2');
            expect(spy.calls.mostRecent().args[0][0][2]).toEqual('sub1, s1');
        });

        it('Should sort the commands by their name', () => {
            commands[0].name = 'b';
            commands[1].name = 'a';
            helpUtils.moduleCommands(commands, subcommands);
            expect(spy.calls.mostRecent().args[0][0][0]).toEqual('a');
            expect(spy.calls.mostRecent().args[0][0][1]).toEqual('b');
            expect(spy.calls.mostRecent().args[0][0][2]).toEqual('sub1, s1');
        });

        it('Should not include star commands', () => {
            commands[0].name = '*';
            helpUtils.moduleCommands(commands, subcommands);
            const x = spy.calls.mostRecent();
            expect(spy.calls.mostRecent().args[0][0][0]).toEqual('cmd2');
            expect(spy.calls.mostRecent().args[0][0][1]).toEqual('sub1, s1');
        });

        it('Should place the command or subcommand\'s description in the second column with a placeholder if the command does not have a description', () => {
            commands[1].description = undefined;
            helpUtils.moduleCommands(commands, subcommands);
            expect(spy.calls.mostRecent().args[0][1][0]).toEqual('c1 description');
            expect(spy.calls.mostRecent().args[0][1][1]).toEqual('No description avaliable');
            expect(spy.calls.mostRecent().args[0][1][2]).toEqual('s1 description');
        });

    });

});
