import { ParameterDefinition } from '../../../src';
import { OptionsValidator } from '../../../src/internal/parser/options-validator';
import { MappedCliOptionDefinition } from '../../../src/internal/options/option-models';
import { ParametersValidator } from '../../../src/internal/parser/parameter-validator';

export type OptsValidatorSpyCall = () => jasmine.Spy<(definitions: MappedCliOptionDefinition[]) => void>;
export type ParamsValidatorSpyCall = () => jasmine.Spy<(definitions: ParameterDefinition<any>[], commandName: string) => void>;
export class MockParser {

    static optionsValidatorSpy = (
        validator: OptionsValidator,
    ) => () => spyOn(validator, 'validate').and.callFake((opts) => { })

    static paramsValidatorSpy = (
        validator: ParametersValidator,
    ) => () => spyOn(validator, 'validate').and.callFake((opts, cmdName) => { })


}
