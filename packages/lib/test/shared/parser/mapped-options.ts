import { MappedCliOptionDefinition, OptionDefinition } from '../../../src/internal/options/option-models';
import { createOptionMetadata } from '../options/options';
import { Type } from '../../../src/internal/common/cli-types';
import { isConstructor } from '../../../src/internal/common/utils';

export class MockMappedOptions {

    readonly options: MappedCliOptionDefinition[] = [];
    readonly class1 = class MappedOptsClass1 {};
    readonly class2 = class MappedOptsClass2 {};
    readonly class3 = class MappedOptsClass3 {};

    constructor(
    ) {
    }

    add(cls: Type<any> | ((opts: MockMappedOptions) => Type<any>), metadata: Partial<OptionDefinition>) {
        this.options.push({ class: isConstructor(cls) ? cls : (cls as Function)(this), def: createOptionMetadata(metadata) });
        return this;
    }

    edit(index: number, metadata: Partial<OptionDefinition>) {
        this.options[index].def = { ...this.options[0].def, ...metadata };
        return this;
    }

    remove(index: number) {
        this.options.splice(index, 1);
        return this;
    }

}
