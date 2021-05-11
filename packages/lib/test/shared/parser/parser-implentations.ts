import { Type } from '../../../src/internal/common/cli-types';
import { ProviderToken } from '../../../src/internal/dependency-injection/providers';
import {
    ArgumentsParser, OptionsParser, ParameterParser, DefaultArgumentsParser,
    ARGS_PARSER, DefaultOptionsParser, OPTIONS_PARSER, DefaultParameterParser,
    PARAMETERS_PARSER, DefaultTypeCaster, AppContext, TYPE_CASTER, TypeCaster
} from '../../../src';
import { parserConfig, ParserConfig } from '../../../src/internal/parser/parser-config';

/**
 * Implementation of a default parsing behavior
 */
interface DefaultParserImplementation<T> {
    provider: Type<T>;
    token: ProviderToken;
    resolve: (config?: Partial<ParserConfig>, typeCaster?: TypeCaster) => T;
}

/**
 * Implementations of the default parsing behavior
 */
export const parserImplementations: {
    arguments: DefaultParserImplementation<ArgumentsParser>,
    options: DefaultParserImplementation<OptionsParser>,
    parameters: DefaultParserImplementation<ParameterParser>,
    typeCasting: DefaultParserImplementation<TypeCaster>
} = {
    arguments: {
        provider: DefaultArgumentsParser,
        token: ARGS_PARSER,
        resolve: (config?) => new DefaultArgumentsParser(config ? {...parserConfig, ...config} : parserConfig)
    },
    options: {
        provider: DefaultOptionsParser,
        token: OPTIONS_PARSER,
        resolve: (config?, typeCaster?) => new DefaultOptionsParser(
            config ? { ...parserConfig, ...config } : parserConfig,
            typeCaster || parserImplementations.typeCasting.resolve()
        )
    },
    parameters: {
        provider: DefaultParameterParser,
        token: PARAMETERS_PARSER,
        resolve: (config?, typeCaster?) => new DefaultParameterParser(
            config ? { ...parserConfig, ...config } : parserConfig,
            typeCaster || parserImplementations.typeCasting.resolve()
        )
    },
    typeCasting: {
        provider: DefaultTypeCaster,
        token: TYPE_CASTER,
        resolve: () => new DefaultTypeCaster(new AppContext('cli', '1.0.0'))
    }
};
