import { HelpUtilities,  CommandDescription, DefaultModuleHelp } from '../../src';
import { ModuleDescription } from '../../src/internal/module/module-models';
import { createModuleDescription, createCommandDescription, createOptionDescription, createParameterDescription } from '../shared';
import * as chalk from 'chalk';

describe('DefaultModuleHelp[class]', () => {

    describe('showHelp()', () => {

        let helpUtils: HelpUtilities;
        let moduleHelp: DefaultModuleHelp;
        let singleLineCmdSpy: jasmine.Spy<(des: CommandDescription, dontExpand: boolean) => string>;
        let singleLineModSpy: jasmine.Spy<(des: ModuleDescription) => string>;
        let consoleSpy: jasmine.Spy<(...args: any) => void>;
        let commandsSpy: jasmine.Spy<(commands: CommandDescription[], subCommands: ModuleDescription[]) => string>;
        let err: Error;
        let moduleDescription: ModuleDescription;
        let command: CommandDescription;

        beforeEach(() => {

            err = new Error('#ERROR-MESSAGE');
            helpUtils = new HelpUtilities();
            moduleHelp = new DefaultModuleHelp(helpUtils);
            consoleSpy = spyOn(process.stderr, 'write');
            singleLineCmdSpy = spyOn(helpUtils, 'singleLineCommand').and.returnValue('#SINGLE-LINE-COMMAND');
            singleLineModSpy = spyOn(helpUtils, 'singleLineModule').and.returnValue('#SINGLE-LINE-MODULE');
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
            moduleHelp.showHelp(moduleDescription, err);
            expect(result().startsWith(chalk.red(`\n*ERROR*\n${err.message}\n`))).toBe(true);
        });

        it('For modules without star commands it should show the usage as a singLineModule and the underlying commands and subcommands', () => {
            moduleHelp.showHelp(moduleDescription);
            expect(result()).toContain(`#SINGLE-LINE-MODULE\n#MOD-COMMANDS\n`);
            expect(singleLineModSpy).toHaveBeenCalledWith(moduleDescription);
            expect(commandsSpy).toHaveBeenCalledWith(moduleDescription.commands, moduleDescription.subCommands);
        });

        it('For modules that dont have star commands it should not show the subcommands or commands when none exist', () => {
            moduleDescription.commands = [];
            moduleDescription.subCommands = [];
            moduleHelp.showHelp(moduleDescription);
            expect(result()).toContain(`#SINGLE-LINE-MODULE\n`);
            expect(result().indexOf('#MOD-COMMANDS')).toBe(-1);
            expect(commandsSpy).not.toHaveBeenCalled();
        });

        it('For modules with star commands it should show the usage as a singLineModule and singleLineCommand, as well as show the underlying commands and subcommands', () => {
            command.name = '*';
            moduleHelp.showHelp(moduleDescription);
            const expectedResult = `${chalk.yellow('(1)')} #SINGLE-LINE-MODULE\n${chalk.yellow('(2)')} #SINGLE-LINE-COMMAND\n#MOD-COMMANDS\n`;
            expect(result()).toContain(expectedResult);
            expect(singleLineModSpy).toHaveBeenCalledWith(moduleDescription);
            expect(commandsSpy).toHaveBeenCalledWith(moduleDescription.commands, moduleDescription.subCommands);
        });

        it('For modules that have star commands it should not show the subcommands or commands when none exist', () => {
            command.name = '*';
            moduleDescription.subCommands = [];
            moduleHelp.showHelp(moduleDescription);
            expect(result()).toContain(`${chalk.yellow('(1)')} #SINGLE-LINE-MODULE\n${chalk.yellow('(2)')} #SINGLE-LINE-COMMAND\n`);
            expect(result().indexOf('#MOD-COMMANDS')).toBe(-1);
            expect(commandsSpy).not.toHaveBeenCalled();
        });

    });
});
