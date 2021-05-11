import { OptionsParser, TypeCaster, ParsedOption, OptionDefinition } from '../../src';
import { OptionParsingError } from '../../src/internal/common/cli-types';
import { parserImplementations, MockParserParams, MockParserParamDef, createMockParserParams  } from '../shared';

describe('DefaultOptionsParser[class]', () => {

    const castValue = { value: 1 };
    let parser: OptionsParser;
    let typeCaster: TypeCaster;
    let typeCasterSpy: jasmine.Spy<(defintion: OptionDefinition<any>, parsed: ParsedOption) => any>;
    let params: MockParserParams;
    let defs: MockParserParamDef[];

    beforeEach(() => {
        typeCaster = parserImplementations.typeCasting.resolve();
        typeCasterSpy = spyOn(typeCaster, 'castOption').and.returnValue(castValue);
        parser = parserImplementations.options.resolve({}, typeCaster);
        defs = [
            { name: '--prod-opt', argType: 'opt' },
            { name: '-n', argType: 'opt' },
            { name: 'name-value', argType: 'optval' },
            { name: '-n', argType: 'opt' },
            { name: '--config', argType: 'opt' },
            { name: './configpath', argType: 'optval' },

        ];
    });

    const parse = (testParmas: MockParserParams) => parser.parseOptions(testParmas.optionMetadata, testParmas.argumentContext.options);

    describe('parseOptions()', () => {

        it('Should associate options with their metadata by matching the aliases and names', () => {
            parser = parserImplementations.options.resolve({ applyTypeCasting: false }, typeCaster);
            params = createMockParserParams(defs);
            const evaluatedOpts = parse(params);
            expect(params.getEvaluatedOption(evaluatedOpts, 'prod-opt').value).toEqual(params.getParsedOption(params.argumentContext, '--prod-opt').value);
            expect(params.getEvaluatedOption(evaluatedOpts, null, 'n').value).toEqual(params.getParsedOption(params.argumentContext, '-n').value);
            expect(params.getEvaluatedOption(evaluatedOpts, 'config').value).toEqual(params.getParsedOption(params.argumentContext, '--config').value);
        });

        it('Should throw an OptionParsingError if the options contain the same option that is called by both its name and alias', () => {
            params = createMockParserParams(defs).modifyOptionMetadata(0, { alias: 'n' });
            expect(() => parse(params)).toThrowError(OptionParsingError);
        });

        it('Should not throw an error if some options metadata cannot be resolved with a parsed option but those options are not required', () => {
            params = createMockParserParams(defs).addOptionMetadata({ required: false });
            expect(() => parse(params)).not.toThrowError();
        });

        it('Should throw an OptionParsingError if some required options metadata cannot be resolved with a parsed option', () => {
            params = createMockParserParams(defs).addOptionMetadata({ required: true });
            expect(() => parse(params)).toThrowError(OptionParsingError);
        });

        it('Should not throw an OptionParsingError if some options can\'t be associated with metadata parserConfig.ignoreUnknownOptions is true', () => {
            params = createMockParserParams(defs).removeOptionMetadata(0);
            parser = parserImplementations.options.resolve({ ignoreUnknownOptions: true }, typeCaster);
            expect(() => parse(params)).not.toThrowError();
        });

        it('Should throw an OptionParsingError if some options can\'t be associated with metadata parserConfig.ignoreUnknownOptions is false', () => {
            params = createMockParserParams(defs).removeOptionMetadata(0);
            expect(() => parse(params)).toThrowError(OptionParsingError);
        });

        it('Should call the typeCaster.castOption function when the parserConfig.applyTypeCasting is true and the option\'s typeChecks metadata is unset', () => {
            params = createMockParserParams(defs.slice(0, 1));
            parse(params);
            expect(typeCasterSpy).toHaveBeenCalledWith(params.optionMetadata[0], params.argumentContext.options[0]);
        });

        it('Should not call the typeCaster.castOption function when the parserConfig.applyTypeCasting is false and the option\'s typeChecks metadata is unset', () => {
            params = createMockParserParams(defs.slice(0, 1));
            parser = parserImplementations.options.resolve({ applyTypeCasting: false }, typeCaster);
            parse(params);
            expect(typeCasterSpy).not.toHaveBeenCalled();
        });

        it('Should call the typeCaster.castOption function when the parserConfig.applyTypeCasting is false but the option\'s typeChecks metadata is true', () => {
            parser = parserImplementations.options.resolve({ applyTypeCasting: true }, typeCaster);
            params = createMockParserParams(defs.slice(0, 1)).modifyOptionMetadata(0, { typeChecks: true });
            parse(params);
            expect(typeCasterSpy).toHaveBeenCalledWith(params.optionMetadata[0], params.argumentContext.options[0]);
        });

        it('Should not call the typeCaster.castOption function when the parserConfig.applyTypeCasting is true but the option\'s typeChecks metadata is false', () => {
            params = createMockParserParams(defs.slice(0, 1)).modifyOptionMetadata(0, { typeChecks: false });
            parse(params);
            expect(typeCasterSpy).not.toHaveBeenCalled();
        });

        it('Should use the value returned from the type caster when the type caster is used', () => {
            params = createMockParserParams(defs.slice(0, 1));
            expect(parse(params)[0].value).toBe(castValue);
        });

    });

});
