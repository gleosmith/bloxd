import { MockParserParams, MockParserParamDef } from '../shared/parser/mock-parser-params';
import { ParametersValidator } from '../../src/internal/parser/parameter-validator';

describe('ParameterValidator[class]', () => {

    let params: MockParserParams;
    let defs: MockParserParamDef[];
    let validator: ParametersValidator;
    beforeEach(() => {
        validator = new ParametersValidator();
        defs = [
            { name: 'value1', argType: 'param' },
            { name: 'value2', argType: 'param' },
            { name: 'value3', argType: 'param' }
        ];
        params = new MockParserParams(defs);
    });

    const validate = (testParams: MockParserParams) => validator.validate(params.parameterMetadata, 'command1');

    describe('validator()', () => {

        it('Should not throw an error when all metadata is valid', () => {
            expect(() => validate(params)).not.toThrowError();
        });

        it('Should throw an error when the metadata index does not begin at 0', () => {

            params
                .modifyParameterMetadata(0, { index: 0 })
                .modifyParameterMetadata(1, { index: 1 })
                .modifyParameterMetadata(2, { index: 2 });

            expect(() => validate(params)).toThrowError();

            params
                .modifyParameterMetadata(0, { index: 2 })
                .modifyParameterMetadata(1, { index: 3 })
                .modifyParameterMetadata(2, { index: 4 });

            expect(() => validate(params)).toThrowError();
        });

        it('Should throw an error if an array parameter is not the last index', () => {
            params
                .modifyParameterMetadata(0, { index: 1 })
                .modifyParameterMetadata(1, { index: 2})
                .modifyParameterMetadata(2, { index: 3, isArray: true });
            expect(() => validate(params)).not.toThrowError();
        });

        it('Should throw an error when the metadata indices are not sequential', () => {
            params
                .modifyParameterMetadata(1, { index: 3 })
                .modifyParameterMetadata(2, { index: 4 });
            expect(() => validate(params)).toThrowError();
        });

        it('Should throw an error when one or more options have the same name', () => {
            params.modifyParameterMetadata(1, { name: 'parameter1' }).modifyParameterMetadata(0, { name: 'parameter1' });
            expect(() => validate(params)).toThrowError();
        });

        it('Should throw an error when optional parameters come before required', () => {
            params.modifyParameterMetadata(1, { optional: true });
            expect(() => validate(params)).toThrowError();
        });

        it('Should not throw an error when optional parameters come after required', () => {
            params.modifyParameterMetadata(2, { optional: true });
            validate(params);
            expect(() => validate(params)).not.toThrowError();
        });

    });

});
