import { ArgumentsContext, OptionDefinition, ParameterDefinition, ParserConfig, ParsedOption, EvaluatedOption, EvaluatedParameter } from '../../../src';
import { parserConfig } from '../../../src/internal/parser/parser-config';
import { createOptionMetadata } from '../options/options';
import { EvaluatedArgumentsContext } from '../../../src/internal/parser/arguments-context';
import { ModuleRef } from '../../../src/internal/module/module-ref';
import { RegisteredRoute } from '../../../src/internal/command/registered-route';

/**
 * Defintion to construct test params for the ParserModule through the factory function
 */
export interface MockParserParamDef {
    name: string;
    argType: 'param' | 'cmd' | 'opt' | 'optval';
}

/**
 * Parser parameters and results for testing purposes
 */
export class MockParserParams {

    /**
     * Arguments from cli
     */
    rawArgs: string[];

    /**
     * Context evaluated by the argument parser
     */
    argumentContext: ArgumentsContext;

    /**
     * Partial options metadata revelant to the parsing behaviour
     */
    optionMetadata: OptionDefinition[];

    /**
     * Partial parameter metadata relevant to the parsing behavior
     */
    parameterMetadata: ParameterDefinition[];

    private defs: MockParserParamDef[];

    constructor(
        defs: MockParserParamDef[],
        config?: Partial<ParserConfig>
    ) {

        config = config ? { ...parserConfig, ...config } : parserConfig;

        this.defs = defs;

        this.rawArgs = defs.map(a => a.name);
        this.argumentContext = {
            possibleParameters: defs.filter(a => a.argType === 'param' || a.argType === 'cmd').map(a => a.name),
            possibleCommands: defs.filter(a => a.argType === 'cmd' || (config.allowCommandsAfterOptions ? a.argType === 'param' : false)).map(a => a.name),
            options: (defs.map((a, i, all) => {
                if (a.argType === 'opt') {
                    return {
                        isAlias: !a.name.startsWith('--'),
                        rawName: a.name,
                        cleanedName: !a.name.startsWith('--') ? a.name.replace('-', '') : a.name.replace('--', ''),
                        value: all.length - 1 >= i + 1 && all[i + 1].argType === 'optval' ? all[i + 1].name : true
                    } as ParsedOption;
                }
                return null;
            }).filter(a => !!a) as ParsedOption[])
                .reduce((prev, cur, i, arr) => {
                    if (!prev.find(a => a.rawName === cur.rawName)) {
                        return [...prev, {
                            ...cur,
                            value: arr.filter(a => a.rawName === cur.rawName).length > 1 ? arr.filter(a => a.rawName === cur.rawName).map(a => a.value) : cur.value
                        }];
                    }
                    return prev;
                }, [] as ParsedOption[])
        };

        this.optionMetadata = this.argumentContext.options.map((opt, index) => ({
            typeChecks: undefined,
            name: opt.isAlias ? `name-${index}` : opt.cleanedName,
            alias: opt.isAlias ? opt.cleanedName : `a${index}`,
            designType: undefined,
            description: undefined,
            data: undefined,
            propertyName: undefined,
            required: false
        }));

        this.parameterMetadata = defs.filter(a => a.argType === 'param').map((p, index) => ({
            index: index + 1,
            description: null,
            designType: null,
            typeChecks: undefined,
            isArray: false,
            name: `parameter-${index + 1}`,
            data: undefined,
            optional: false,
            propertyName: undefined
        }));

    }

    createEvaluatedContext(
        route: RegisteredRoute,
        parentModules: ModuleRef[]
    ): EvaluatedArgumentsContext {
        return {
            ...this.argumentContext,
            route,
        };
    }

    get parameterValues() {
        return this.defs.filter(d => d.argType === 'param').map(d => d.name);
    }

    getEvaluatedOption(opts: EvaluatedOption[], name?: string, alias?: string) {
        return opts.find(o => name ? o.definition.name === name : o.definition.alias === alias);
    }


    getEvaluatedParam(params: EvaluatedParameter[], index: number) {
        return params.find(p => p.definition.index === index);
    }

    getParsedOption(context: ArgumentsContext, rawName: string) {
        return context.options.find(o => o.rawName === rawName);
    }

    modifyOptionMetadata(index: number, metadata: Partial<OptionDefinition>) {
        this.optionMetadata[index] = { ...this.optionMetadata[index], ...metadata };
        return this;
    }

    modifyParameterMetadata(index: number, metadata: Partial<ParameterDefinition>) {
        this.parameterMetadata[index] = { ...this.parameterMetadata[index], ...metadata };
        return this;
    }

    removeOptionMetadata(index: number) {
        this.optionMetadata.splice(index, 1);
        return this;
    }

    removeParameterMetadata(index: number) {
        this.parameterMetadata.splice(index, 1);
        return this;
    }

    addOptionMetadata(metadata: Partial<OptionDefinition>) {
        this.optionMetadata.push({
            ...createOptionMetadata({
                name: `name${this.optionMetadata.length}`,
                alias: `a${this.optionMetadata.length}`,
                designType: undefined,
            }),
            ...metadata
        });
        return this;
    }

    addParameterMetadata(metadata: Partial<ParameterDefinition>) {
        this.parameterMetadata.push({
            typeChecks: undefined,
            name: `name${this.optionMetadata.length}`,
            index: this.parameterMetadata.length,
            designType: undefined,
            description: undefined,
            isArray: false,
            data: undefined,
            propertyName: undefined,
            optional: false,
            ...metadata
        });
        return this;
    }
}

export const createMockParserParams = (
    args: MockParserParamDef[],
    config?: Partial<ParserConfig>
) => new MockParserParams(args, config);
