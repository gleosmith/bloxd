import { ParamsValidatorSpyCall } from './../shared/parser/parser-utils';
import { TypeCaster, ParameterDefinition, ParameterParser } from '../../src';
import { MockParserParams, MockParserParamDef, createMockParserParams } from '../shared/parser/mock-parser-params';
import { ParameterParsingError } from '../../src/internal/common/cli-types';
import { parserImplementations } from './../shared';

describe('DefaultParameterParser[class]', () => {

    const castValue = { value: 1 };
    let parser: ParameterParser;
    let typeCaster: TypeCaster;
    let typeCasterSpy: jasmine.Spy<(defintion: ParameterDefinition<any>, value: any) => any>;
    let params: MockParserParams;
    let defs: MockParserParamDef[];

    beforeEach(() => {
        typeCaster = parserImplementations.typeCasting.resolve();
        typeCasterSpy = spyOn(typeCaster, 'castParameter').and.returnValue(castValue);
        parser = parserImplementations.parameters.resolve({}, typeCaster);
        defs = [
            { name: 'value1', argType: 'param' },
            { name: 'value2', argType: 'param' },
            { name: 'value3', argType: 'param' }
        ];
    });

    const parse = (testParams: MockParserParams) => parser.parseParameters(testParams.parameterMetadata, testParams.parameterValues);

    describe('parseParameters()', () => {

        it('Should associate parameter values to their metadata based on the index', () => {
            params = createMockParserParams(defs);
            const result = parse(params);
            expect(params.getEvaluatedParam(result, 1)?.definition).toEqual(params.parameterMetadata[0]);
            expect(params.getEvaluatedParam(result, 2)?.definition).toEqual(params.parameterMetadata[1]);
            expect(params.getEvaluatedParam(result, 3)?.definition).toEqual(params.parameterMetadata[2]);
        });

        it('Should parse array paramters as parameter values', () => {
            params = createMockParserParams(defs)
                .removeOptionMetadata(1)
                .modifyParameterMetadata(2, { isArray: true });
            parser.parseParameters(params.parameterMetadata.slice(1), params.parameterValues)
            expect(typeCasterSpy).toHaveBeenCalledWith(params.parameterMetadata[2], params.parameterValues.slice(1));
        });

        it('Should throw a ParameterParsingError when parameter metadata cannot be associated with a value and the metadata is not optional', () => {
            params = createMockParserParams(defs).addParameterMetadata({ name: 'param', optional: false });
            expect(() => parse(params)).toThrowError(ParameterParsingError);
        });

        it('Should not throw a ParameterParsingError when parameter metadata cannot be associated with a value and the metadata is optional', () => {
            params = createMockParserParams(defs).addParameterMetadata({ name: 'param', optional: true });
            expect(() => parse(params)).not.toThrowError(ParameterParsingError);
        });

        it('Should throw a ParameterParsingError when there are additional values that connot be associated with metadata and the parserConfig.ignoreUnknownParameters is false', () => {
            params = createMockParserParams(defs).removeParameterMetadata(1);
            expect(() => parse(params)).toThrowError(ParameterParsingError);
        });

        it('Should not throw a ParameterParsingError when there are additional values that connot be associated with metadata and the parserConfig.ignoreUnknownParameters is true', () => {
            parser = parserImplementations.parameters.resolve({ ignoreUnknownParameters: true }, typeCaster);
            params = createMockParserParams(defs, { ignoreUnknownParameters: true }).removeParameterMetadata(1);
            expect(() => parse(params)).not.toThrowError(ParameterParsingError);
        });

        it('Should call the typeCaster.castOption function when the parserConfig.applyTypeCasting is true and the option\'s typeChecks metadata is unset', () => {
            params = createMockParserParams(defs.slice(0, 1));
            parse(params);
            expect(typeCasterSpy).toHaveBeenCalledWith(params.parameterMetadata[0], params.parameterValues[0]);
        });

        it('Should not call the typeCaster.castOption function when the parserConfig.applyTypeCasting is false and the option\'s typeChecks metadata is unset', () => {
            params = createMockParserParams(defs.slice(0, 1));
            parser = parserImplementations.parameters.resolve({ applyTypeCasting: false }, typeCaster);
            parse(params);
            expect(typeCasterSpy).not.toHaveBeenCalled();
        });

        it('Should call the typeCaster.castOption function when the parserConfig.applyTypeCasting is false but the option\'s typeChecks metadata is true', () => {
            params = createMockParserParams(defs.slice(0, 1)).modifyParameterMetadata(0, { typeChecks: true });
            parser = parserImplementations.parameters.resolve({ applyTypeCasting: false }, typeCaster);
            parse(params);
            expect(typeCasterSpy).toHaveBeenCalledWith(params.parameterMetadata[0], params.parameterValues[0]);
        });

        it('Should not call the typeCaster.castOption function when the parserConfig.applyTypeCasting is true but the option\'s typeChecks metadata is false', () => {
            params = createMockParserParams(defs.slice(0, 1)).modifyParameterMetadata(0, { typeChecks: false });
            parse(params);
            expect(typeCasterSpy).not.toHaveBeenCalled();
        });

        it('Should use the value return from the type caster when the type caster is used', () => {
            params = createMockParserParams(defs.slice(0, 1));
            expect(parse(params)[0]?.value).toBe(castValue);
        });

    });

});
