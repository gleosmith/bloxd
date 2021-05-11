import { MockMappedOptions } from '../../test/shared/parser/mapped-options';
import { OptionsValidator } from './../../src/internal/parser/options-validator';

describe('OptionsValidator[class]', () => {


    describe('valdiate()', () => {

        let opts: MockMappedOptions;
        let validator: OptionsValidator;
        beforeEach(() => {
            validator = new OptionsValidator();
            opts = new MockMappedOptions()
                .add(o => o.class1, { name: 'opt1', alias: '1', designType: String, description: 'Options description 1' })
                .add(o => o.class1, { name: 'opt2', alias: '2', designType: String, description: 'Options description 2' })

                .add(o => o.class2, { name: 'opt3', alias: '3', designType: Number, description: 'Options description 3' })
                .add(o => o.class2, { name: 'opt4', alias: '4', designType: Number, description: 'Options description 4' })
                .add(o => o.class3, { name: 'opt5', alias: '5', designType: Boolean, description: 'Options description 5' })
                .add(o => o.class3, { name: 'opt2', alias: '2', designType: String, description: 'Options description 2' });
        });

        it('Should not throw an error if all options are valid', () => {
            opts.remove(5);
            expect(() => validator.validate(opts.options)).not.toThrowError();
        });

        it('Should throw and error if the same class has two options with the same name', () => {
            opts.remove(5).edit(1, { name: 'opt1'});
            expect(() => validator.validate(opts.options)).toThrowError();
        });

        it('Should throw an error if the same class has two options with the same alias', () => {
            opts.remove(5).edit(1, { alias: '1' });
            expect(() => validator.validate(opts.options)).toThrowError();
        });

        it('Should not throw an error when two options from different classes have the same name, alias, description, design type and required flags', () => {
            expect(() => validator.validate(opts.options)).not.toThrowError();
        });

        it('Should throw an error when two options from different classes have the same name but a different aliases', () => {
            opts.edit(5, { alias: '6' });
            expect(() => validator.validate(opts.options)).toThrowError();
        });

        it('Should throw an error when two options from different classes have the same name but a different descriptions', () => {
            opts.edit(5, { description: 's' });
            expect(() => validator.validate(opts.options)).toThrowError();
        });

        it('Should throw an error when two options from different classes have the same name but a different types', () => {
            opts.edit(5, { designType: Number });
            expect(() => validator.validate(opts.options)).toThrowError();
        });


        it('Should throw an error when two options from different classes have the same name but a required flags', () => {
            opts.edit(5, { required: true });
            expect(() => validator.validate(opts.options)).toThrowError();
        });

        it('Should throw an error when two options from different classes have the same alias but different names', () => {
            opts.edit(5, { name: 'opt6' });
            expect(() => validator.validate(opts.options)).toThrowError();
        });

        it('Should throw an error when the name of one option conflicts with the alias of another', () => {
            opts.edit(3, { name: '5' });
            expect(() => validator.validate(opts.options)).toThrowError();
        });

    });

});
