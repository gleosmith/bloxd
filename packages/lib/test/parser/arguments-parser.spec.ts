
import { ArgumentsParser } from '../../src';
import { parserImplementations, MockParserParams, MockParserParamDef, createMockParserParams } from '../shared';

describe('DefaultArgumentsParser[class]', () => {

    describe('parse()', () => {

        let parser: ArgumentsParser;
        let params: MockParserParams;
        let defs: MockParserParamDef[];
        beforeEach(() => {
            parser = parserImplementations.arguments.resolve();
            defs = [
                { name: 'create', argType: 'cmd' },
                { name: 'update', argType: 'cmd' },
                { name: '--prod-opt', argType: 'opt' },
                { name: '-n', argType: 'opt' },
                { name: 'name-value', argType: 'optval' },
                { name: '-n', argType: 'opt' },
                { name: '--config', argType: 'opt' },
                { name: './configpath', argType: 'optval' },

                { name: 'paramval1', argType: 'param' },
                { name: 'paramval2', argType: 'param' }
            ];
        });

        it('Should not throw an error if it recieves an empty array', () => {
            expect(() => parser.parse([])).not.toThrowError();
        });

        it('Should read all arguments that are not options and option values as possible parameters', () => {
            params = createMockParserParams(defs);
            expect(parser.parse(params.rawArgs).possibleParameters).toEqual(['create', 'update', 'paramval1', 'paramval2']);
        });

        it('Should read all arguments before the first option as possible commands when allCommandsAfterOptions is false', () => {
            params = createMockParserParams(defs);
            expect(parser.parse(params.rawArgs).possibleCommands).toEqual(['create', 'update']);
        });

        it('Should read all arguments before the first option as possible commands when allCommandsAfterOptions is false', () => {
            params = createMockParserParams(defs, { allowCommandsAfterOptions: true });
            parser = parserImplementations.arguments.resolve({ allowCommandsAfterOptions: true });
            expect(parser.parse(params.rawArgs).possibleCommands).toEqual(['create', 'update', 'paramval1', 'paramval2']);
        });

        it('Should possible parameters should be the same as possible commands when allCommandsAfterOptions is true', () => {
            params = createMockParserParams(defs, { allowCommandsAfterOptions: true });
            parser = parserImplementations.arguments.resolve({ allowCommandsAfterOptions: true });
            expect(parser.parse(params.rawArgs).possibleCommands).toEqual(parser.parse(params.rawArgs).possibleParameters);
        });

        it('Should have no possible commands when only options are provided', () => {
            params = createMockParserParams([...defs].slice(2, 8));
            expect(parser.parse(params.rawArgs).possibleCommands).toEqual([]);
        });

        it('Should have no possible parameters when only options are provided', () => {
            params = createMockParserParams([...defs].slice(2, 8));
            expect(parser.parse(params.rawArgs).possibleParameters).toEqual([]);
        });

        it('Should read arguments prefixed with -- as options that have been defined by their name', () => {
            params = createMockParserParams(defs);
            expect(params.getParsedOption(parser.parse(params.rawArgs), '--prod-opt')).toBeTruthy();
            expect(params.getParsedOption(parser.parse(params.rawArgs), '--prod-opt')?.isAlias).toBeFalse();
        });

        it('Should read arguments prefixed with - as options that have been defined by their alias', () => {
            params = createMockParserParams(defs);
            expect(params.getParsedOption(parser.parse(params.rawArgs), '-n')).toBeTruthy();
            expect(params.getParsedOption(parser.parse(params.rawArgs), '-n')?.isAlias).toBeTrue();
        });

        it('For options, set the raw name to the argument and the cleaned name to raw name without the dash prefixes', () => {
            params = createMockParserParams(defs);
            expect(params.getParsedOption(parser.parse(params.rawArgs), '--prod-opt')?.cleanedName).toBe('prod-opt');
            expect(params.getParsedOption(parser.parse(params.rawArgs), '--prod-opt')?.rawName).toBe('--prod-opt');
            expect(params.getParsedOption(parser.parse(params.rawArgs), '-n')?.cleanedName).toBe('n');
            expect(params.getParsedOption(parser.parse(params.rawArgs), '-n')?.rawName).toBe('-n');
        });

        it('Should set the value, for options not followed by an unprefixed argument, to true', () => {
            params = createMockParserParams(defs);
            expect(params.getParsedOption(parser.parse(params.rawArgs), '--prod-opt')?.value).toBeTrue();
        });

        it('Should set the value, for options not followed any any arguments, to true', () => {
            params = createMockParserParams(defs.slice(0, 7));
            expect(params.getParsedOption(parser.parse(params.rawArgs), '--config')?.value).toBeTrue();
        });

        it('Should set the value for option to the preceeding argument if it is not prefixed with dashes', () => {
            params = createMockParserParams(defs);
            expect(params.getParsedOption(parser.parse(params.rawArgs), '--config')?.value).toBe('./configpath');
        });

        it('Should should combine multiple options with the same name/alias into a single option with an array value', () => {
            params = createMockParserParams(defs);
            expect(parser.parse(params.rawArgs).options.filter(o => o.rawName === '-n').length).toBe(1);
            expect(params.getParsedOption(parser.parse(params.rawArgs), '-n')?.value).toEqual(['name-value', true]);
        });

    });


});
