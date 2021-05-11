import { MockParserParams, parserImplementations } from '../shared';
import { DefaultTypeCaster, Int, FilePath, AppContext } from '../../src';
import { TypeCastingError } from '../../src/internal/common/cli-types';
import * as path from 'path';


describe('DefaultTypeCaster[class]', () => {

    let params: MockParserParams;
    let caster: DefaultTypeCaster;

    beforeEach(() => {
        caster = parserImplementations.typeCasting.resolve() as DefaultTypeCaster;

        params = new MockParserParams([
            { name: 'opt1', argType: 'opt' },
            { name: 'options-value', argType: 'optval' },
            { name: 'param', argType: 'param' }
        ])
            .modifyOptionMetadata(0, { designType: String })
            .modifyParameterMetadata(0, { designType: String });

    });

    describe('castOption()', () => {

        it('Should call the cast function with the options value, designType and the isOption argument as true', () => {
            const spy = spyOn(caster, 'cast');
            caster.castOption(params.optionMetadata[0], params.argumentContext.options[0]);
            expect(spy.calls.mostRecent().args[0]).toBe('options-value');
            expect(spy.calls.mostRecent().args[1]).toBe(String);
            expect(spy.calls.mostRecent().args[2]).toBe(true);
        });

    });

    describe('castParameter()', () => {

        it('Should call the cast function with the parameters value, designType and the isOption argument as false', () => {
            const spy = spyOn(caster, 'cast');
            caster.castParameter(params.parameterMetadata[0], params.parameterValues[0]);
            expect(spy.calls.mostRecent().args[0]).toBe(params.parameterValues[0]);
            expect(spy.calls.mostRecent().args[1]).toBe(String);
            expect(spy.calls.mostRecent().args[2]).toBe(false);
        });

    });

    describe('cast()', () => {

        it('Should call the castString function with the value and isOption arg when the design type is a string and should return the value from that function', () => {
            const spy = spyOn(caster, 'castString').and.returnValue('testvalue#1');
            const result = caster.cast('1', String, true);
            expect(spy).toHaveBeenCalledWith('1', true);
            expect(result).toBe('testvalue#1');
        });

        it('Should call the castBoolean function with the value and isOption arg when the design type is a boolean and should return the value from that function', () => {
            const spy = spyOn(caster, 'castBoolean').and.returnValue(false);
            const result = caster.cast('1', Boolean, true);
            expect(spy).toHaveBeenCalledWith('1', true);
            expect(result).toBe(false);
        });

        it('Should call the castBoolean function with the value and isOption arg when the design type is a boolean and should return the value from that function', () => {
            const spy = spyOn(caster, 'castNumber').and.returnValue(20);
            const result = caster.cast('7', Number, false);
            expect(spy).toHaveBeenCalledWith('7', false);
            expect(result).toBe(20);
        });

        it('Should call the castInt function with the value and isOption arg when the design type is a Int and should return the value from that function', () => {
            const spy = spyOn(caster, 'castInt').and.returnValue(1);
            const result = caster.cast('2', Int, true);
            expect(spy).toHaveBeenCalledWith('2', true);
            expect(result).toBe(1);
        });

        it('Should call the castInt function with the value when the design type is a FilePath and should return the value from that function', () => {
            const p = new FilePath('','');
            const spy = spyOn(caster, 'castFilePath').and.returnValue(p);
            const result = caster.cast('./', FilePath, true);
            expect(spy).toHaveBeenCalledWith('./');
            expect(result).toBe(p);
        });

        it('Should return the same value when the design type is not a Number, Int, Boolean, FilePath or String', () => {
            expect(caster.cast('./', DefaultTypeCaster, true)).toBe('./');
        });

    });

    describe('castString()', () => {

        it('Should return a string when the provided value is a string', () => {
            expect(caster.castString('value1', true)).toBe('value1');
        });

        it('Should return a string when the provided value is a number', () => {
            expect(caster.castString(12.5, true)).toBe('12.5');
        });

        it('Should throw an error when the provided value is not a number or a string', () => {
            expect(() => caster.castString(null, true)).toThrowError(TypeCastingError);
            expect(() => caster.castString(true, true)).toThrowError(TypeCastingError);
            expect(() => caster.castString(new Date(), true)).toThrowError(TypeCastingError);
        });

    });

    describe('castBoolean()', () => {

        it('Should return a boolean when the provided value is a boolean', () => {
            expect(caster.castBoolean(false, true)).toBe(false);
        });

        it('Should return a true when the provided value "1" or 1', () => {
            expect(caster.castBoolean('1', true)).toBe(true);
            expect(caster.castBoolean(1, true)).toBe(true);
        });

        it('Should return a false when the provided value "0" or 0', () => {
            expect(caster.castBoolean('0', true)).toBe(false);
            expect(caster.castBoolean(0, true)).toBe(false);
        });

        it('Should return a false when the provided is "false" and not case sensitive', () => {
            expect(caster.castBoolean('false', true)).toBe(false);
            expect(caster.castBoolean('FalSe', true)).toBe(false);
        });

        it('Should return a true when the provided is "true" and not case sensitive', () => {
            expect(caster.castBoolean('TRuE', true)).toBe(true);
            expect(caster.castBoolean('true', true)).toBe(true);
        });

        it('Should throw an error for any other values', () => {
            expect(() => caster.castBoolean(null, true)).toThrowError(TypeCastingError);
            expect(() => caster.castBoolean('./aaasd', true)).toThrowError(TypeCastingError);
            expect(() => caster.castBoolean('', true)).toThrowError(TypeCastingError);
        });

    });

    describe('castNumber()', () => {

        it('Should return a number when the provided value is a number', () => {
            expect(caster.castNumber('1.5', false)).toBe(1.5);
            expect(caster.castNumber(-5, false)).toBe(-5);
        });

        it('Should throw an error when the provided value is not a number', () => {
            expect(() => caster.castNumber('1.5.0', false)).toThrowError(TypeCastingError);
            expect(() => caster.castNumber('1.', false)).toThrowError(TypeCastingError);
            expect(() => caster.castNumber('a', false)).toThrowError(TypeCastingError);
            expect(() => caster.castNumber(true, false)).toThrowError(TypeCastingError);
            expect(() => caster.castNumber(undefined, false)).toThrowError(TypeCastingError);
        });

    });

    describe('castInt()', () => {

        it('Should return a number when the provided value is a integer', () => {
            expect(caster.castInt('-1', false)).toBe(-1);
            expect(caster.castInt(3, false)).toBe(3);
        });

        it('Should throw an error when the provided value is not an integer', () => {
            expect(() => caster.castInt('1.5.0', false)).toThrowError(TypeCastingError);
            expect(() => caster.castInt(1.1, false)).toThrowError(TypeCastingError);
            expect(() => caster.castInt('a', false)).toThrowError(TypeCastingError);
            expect(() => caster.castInt(true, false)).toThrowError(TypeCastingError);
            expect(() => caster.castInt(undefined, false)).toThrowError(TypeCastingError);
        });

    });

    describe('castFilePath()', () => {

        it('Should not throw an error when a valid file path is provided', () => {
            expect(() => caster.castFilePath('./src')).not.toThrowError();
        });

        it('Should return an instance of a file path class with a absolute path, and relative path to the cwd', () => {
            const app = new AppContext('cli', '1.0.0');
            const result = caster.castFilePath('./src');
            expect(result instanceof FilePath).toBeTrue();
            expect(result.absolute).toBe(path.join(app.cwd, './src'));
            expect(result.relative).toBe('./src');
        });

        it('Should throw an error when it gets an invalid file path', () => {
            expect(() => caster.castFilePath('./src2')).toThrowError(TypeCastingError);
        });

    });

});
