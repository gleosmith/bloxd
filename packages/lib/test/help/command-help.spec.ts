import { HelpUtilities, CommandDescription, ParameterDescription, OptionDescription, DefaultCommandHelp } from '../../src';
import { ModuleDescription } from '../../src/internal/module/module-models';
import { createModuleDescription, createCommandDescription, createOptionDescription, createParameterDescription } from '../shared';
import * as chalk from 'chalk';

describe('DefaultCommandHelp[class]', () => {

    describe('showHelp()', () => {

        let helpUtils: HelpUtilities;
        let commandHelp: DefaultCommandHelp;
        let singleLineCmdSpy: jasmine.Spy<(des: CommandDescription, dontExpand: boolean) => string>;
        let singleLineModSpy: jasmine.Spy<(des: ModuleDescription) => string>;
        let paramsSpy: jasmine.Spy<(params: ParameterDescription[]) => string>;
        let optsSpy: jasmine.Spy<(params: OptionDescription[]) => string>;
        let consoleSpy: jasmine.Spy<(...args: any) => void>;
        let commandsSpy: jasmine.Spy<(commands: CommandDescription[], subCommands: ModuleDescription[]) => string>;
        let err: Error;
        let moduleDescription: ModuleDescription;
        let command: CommandDescription;

        beforeEach(() => {
            err = new Error('#ERROR-MESSAGE');
            helpUtils = new HelpUtilities();
            commandHelp = new DefaultCommandHelp(helpUtils);
            consoleSpy = spyOn(process.stderr, 'write');
            singleLineCmdSpy = spyOn(helpUtils, 'singleLineCommand').and.returnValue('#SINGLE-LINE-COMMAND');
            singleLineModSpy = spyOn(helpUtils, 'singleLineModule').and.returnValue('#SINGLE-LINE-MODULE');
            paramsSpy = spyOn(helpUtils, 'commandParameters').and.returnValue('\n#COMMAND-PARAMS');
            optsSpy = spyOn(helpUtils, 'commandOptions').and.returnValue('\n#COMMAND-OPTS');
            commandsSpy = spyOn(helpUtils, 'moduleCommands').and.returnValue('\n#MOD-COMMANDS');

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
                ],
                subCommands: [
                    createModuleDescription({ name: 'sub1', description: 's1 description' })
                ]
            };
            command = moduleDescription.commands[0];
            command.parent = moduleDescription;
        });

        const result = () => {
            return consoleSpy.calls.mostRecent().args[0] as string;
        };


        it('Should start with the error message in red if it has been provided', () => {
            commandHelp.showHelp(command, err);
            expect(result().startsWith(chalk.red(`\n*ERROR*\n${err.message}\n`))).toBe(true);
        });

        it('For non star commands it should include the usage as a single line command together with the options and parameters', () => {
            commandHelp.showHelp(command);
            expect(result()).toContain(`#SINGLE-LINE-COMMAND\n#COMMAND-PARAMS\n#COMMAND-OPTS\n`);
            expect(singleLineCmdSpy).toHaveBeenCalledWith(command, true);
            expect(optsSpy).toHaveBeenCalledWith(command.options);
            expect(paramsSpy).toHaveBeenCalledWith(command.parameters);
        });

        it('For non star commands it should not include options and or parameters when the command does not have any options or parameters', () => {
            command.options = [];
            command.parameters = [];
            commandHelp.showHelp(command);
            expect(result()).toContain(`#SINGLE-LINE-COMMAND\n`);
            expect(optsSpy).not.toHaveBeenCalled();
            expect(paramsSpy).not.toHaveBeenCalled();
        });

        it('For star commands it should include the usage both as a singleLineCommand and singleLineModule together with the options and parameters of the command and subcommands of the parent module', () => {
            command.name = '*';
            let expectedResult = `${chalk.yellow('(1)')} #SINGLE-LINE-COMMAND\n${chalk.yellow('(2)')} #SINGLE-LINE-MODULE`;
            expectedResult += '\n#COMMAND-PARAMS\n#COMMAND-OPTS\n#MOD-COMMANDS\n';
            commandHelp.showHelp(command);
            expect(result()).toContain(expectedResult);
            expect(singleLineCmdSpy).toHaveBeenCalledWith(command, true);
            expect(singleLineModSpy).toHaveBeenCalledWith(command.parent);
            expect(optsSpy).toHaveBeenCalledWith(command.options);
            expect(paramsSpy).toHaveBeenCalledWith(command.parameters);
            expect(commandsSpy).toHaveBeenCalledWith(moduleDescription.commands, moduleDescription.subCommands);
        });

        it('For star commands it should not include options and or parameters when the command does not have any options or parameters', () => {
            command.name = '*';
            command.options = [];
            command.parameters = [];
            commandHelp.showHelp(command);
            expect(result().indexOf('#COMMAND-PARAMS')).toBe(-1);
            expect(result().indexOf('#COMMAND-OPTS')).toBe(-1);
            expect(optsSpy).not.toHaveBeenCalled();
            expect(paramsSpy).not.toHaveBeenCalled();
        });

        it('For star commands it should not the parent\'s commands when their are no other commands or subcommands', () => {
            command.name = '*';
            moduleDescription.subCommands = [];
            commandHelp.showHelp(command);
            expect(result().indexOf('#MOD-COMMANDS')).toBe(-1);
            expect(commandsSpy).not.toHaveBeenCalled();
        });

    });

});
