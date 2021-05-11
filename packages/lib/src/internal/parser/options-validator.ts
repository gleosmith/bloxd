import { CliBuildError, OptionParsingError } from './../common/cli-types';
import { Injectable } from '../dependency-injection/injectable-decorator';
import { getDuplicates, removeDuplicates, validateUniqueValues } from '../common/utils';
import { OptionDefinition, MappedCliOptionDefinition } from '../options/option-models';
import { Type } from '../common/cli-types';

/**
 * Validates option metadata defined in the modules and commands within the execution path
 */
@Injectable()
export class OptionsValidator {

    /**
     * Creates a new instance
     */
    constructor() {
    }

    /**
     * Validates option metadata for consistency and duplications, raising errors where inconsistencies are detected
     * @param definitions All option metadata for the execution path with the associated class containers
     */
    public validate(definitions: MappedCliOptionDefinition[]) {
        this.validateAlias(definitions)
        this.hasNoDuplicatesPerClass(definitions);
        this.checkForInconsistentDuplicates(definitions, 'name', d => d.name, 'aliases', d => d.alias);
        this.checkForInconsistentDuplicates(definitions, 'alias', d => d.alias, 'names', d => d.name);
        this.checkForInconsistentDuplicates(definitions, 'name', d => d.name, 'types', d => d.designType);
        this.checkForInconsistentDuplicates(definitions, 'name', d => d.name, 'description', d => d.description);
        this.checkForInconsistentDuplicates(definitions, 'name', d => d.name, 'required flags', d => d.required);
        this.duplicatesAreConsistent(definitions);
    }

    private validateAlias(definitions:  MappedCliOptionDefinition[]) {
        definitions.forEach(def => {
            if(def.def.alias) {
                if(def.def.alias.length > 1) {
                    throw new CliBuildError(`Invalid options: The option alias -${def.def.alias} in the container ${def.class.name} is more than one character long`)
                }
            }
        })
    }

    /**
     * Ensures that no options container class as two options with the name and or alias
     * @param definitions All option metadata for the execution path with the associated class containers
     */
    private hasNoDuplicatesPerClass(definitions: MappedCliOptionDefinition[]) {
        removeDuplicates(definitions, (item1, item2) => item1.class === item2.class)
            .forEach((def) => {
                const classDefintions = definitions.filter(d => d.class === def.class);
                validateUniqueValues(
                    classDefintions,
                    d => d.def.name,
                    (value, item1) => `Invalid options: ${item1.class.name} has two options with the same name "${value}" in a single execution path`
                );
                validateUniqueValues(
                    classDefintions,
                    d => d.def.alias,
                    (value, item1) => `Invalid options: ${item1.class.name} has two options with the same alias "${value}" in a single execution path`
                );
            });
    }

    /**
     * Ensures that the alias of one option does not conflict with the name of another, and vice-versa
     * @param definitions Option metadata for the execution path with the associated class containers
     */
    private duplicatesAreConsistent(definitions: MappedCliOptionDefinition[]) {
        definitions.forEach(def1 => {
            const matchedDefinition = definitions.find(def2 => def2.def.alias === def1.def.name);
            if (matchedDefinition) {
                throw new CliBuildError(`Invalid options: The name and alias are the same for one or more options in a single execution path` +
                    `\n\t- ${def1.class.name}: name=${def1.def.name}, alias=${def1.def.alias}` +
                    `\n\t- ${matchedDefinition.class.name}: name=${matchedDefinition.def.name}, alias=${matchedDefinition.def.alias}`
                );
            }
        });
    }

    /**
      * Ensures that in cases where two or more classes have options with the same or alias, there is sufficient overlap between the defintions so that
      * both options would be parsed in the same manner
      * @param definitions All option metadata for the execution path with the associated class containers
      * @param property1Name Display name for an error message on the first property
      * @param property1 Returns the first property
      * @param property2Name Display name for an error message on the alternate property
      * @param property2 Returns the alternate property
      */
    private checkForInconsistentDuplicates(
        definitions: MappedCliOptionDefinition[],
        property1Name: string,
        property1: (def: OptionDefinition) => any,
        property2Name: string,
        property2: (def: OptionDefinition) => any
    ) {
        const prop1Duplicates = getDuplicates(definitions, d => property1(d.def));
        prop1Duplicates.forEach(duplicates => {

            const prop2Duplicates = duplicates.reduce((prev, cur) => [
                ...prev,
                ...(prev.find(def => property2(def.def) === property2(cur.def)) ? [] : [cur])
            ], [] as { class: Type<any>, def: OptionDefinition }[]);

            if (prop2Duplicates.length > 1) {
                throw new CliBuildError(`Invalid options: One or more options have the same ${property1Name} but different ${property2Name} in a single execution path ${
                    prop2Duplicates.map(def => `\n\t- ${def.class.name}: name=${def.def.name}, alias=${def.def.alias}, type=${def.def.designType.name}`)
                    } `);
            }
        });
    }

}
