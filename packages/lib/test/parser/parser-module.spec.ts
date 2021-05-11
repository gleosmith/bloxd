import {
    ParserModule, ARGS_PARSER, DefaultArgumentsParser, OPTIONS_PARSER, PARAMETERS_PARSER, TYPE_CASTER,
    DefaultParameterParser, DefaultOptionsParser, DefaultTypeCaster, OptionDefinition, ParsedOption, ParameterDefinition,
    ArgumentsParser, ParameterParser, OptionsParser} from '../../src';
import { parserConfig } from '../../src/internal/parser/parser-config';
import { ValueProvider } from '../../src/internal/dependency-injection/providers';
import { OptionsValidator } from '../../src/internal/parser/options-validator';
import { ParametersValidator } from '../../src/internal/parser/parameter-validator';
import {
    parserImplementations, MockModule, MockCommand, MockModuleBuilder, MockParser,
    OptsValidatorSpyCall, ParamsValidatorSpyCall, MockParserParams} from '../shared';
import { EvaluatedArgumentsContext } from '../../src/internal/parser/arguments-context';
import { RegisteredRoute } from '../../src/internal/command/registered-route';
import { MappedCliOptionDefinition } from '../../src/internal/options/option-models';


describe('ParserModule[class]', () => {

    let builder: MockModuleBuilder;
    let parser: ParserModule;
    let argsParser: ArgumentsParser;
    let paramsParser: ParameterParser;
    let optsParser: OptionsParser;
    let optsValidator: OptionsValidator;
    let parmsValidator: ParametersValidator;


    const optsMetadataSpy = (result?: OptionDefinition[]) => spyOn(RegisteredRoute.prototype, 'getOptionsMetadata').and.returnValue(result || []);
    const mappedOptsSpy = (result?: MappedCliOptionDefinition[]) => spyOn(RegisteredRoute.prototype, 'getMappedOptions').and.returnValue(result || []);

    beforeEach(() => {
        argsParser = parserImplementations.arguments.resolve();
        paramsParser = parserImplementations.parameters.resolve();
        optsParser = parserImplementations.options.resolve();
        optsValidator = new OptionsValidator();
        parmsValidator = new ParametersValidator();
        parser = new ParserModule(argsParser, optsParser, paramsParser, parmsValidator, optsValidator);

        builder = new MockModuleBuilder()
            .addCommand(new MockCommand('cmd1'))
            .addCommand(new MockCommand('cmd2'))
            .addCommand(new MockCommand('cmd3'))
            .addModule(new MockModule())
            .addModule(new MockModule())
            .addModule(new MockModule())
            .selectRoot();

    });

    const buildTreeWithSubcommands = (
        moduleBuilder: MockModuleBuilder
    ) => moduleBuilder.from(b => b.getModule(0))
        .addRoute(b => b.getCommand(0))
        .addRoute(b => b.getCommand(1))
        .addRouteAndSelect(b => b.getModule(1))
        .addRoute(b => b.getCommand(2))
        .selectParent();



    describe('forRoot()[static]', () => {

        it('Should return a configured module with the ParserModule', () => {
            expect(ParserModule.forRoot().module).toBe(ParserModule);
        });

        it('If no implementations, or implementations are provided as null or undefined values it should not return any implementations', () => {
            let providers = ParserModule.forRoot().providers;
            expect(providers).not.toContain({ provide: ARGS_PARSER, useClass: DefaultArgumentsParser });
            expect(providers).not.toContain({ provide: OPTIONS_PARSER, useClass: DefaultOptionsParser });
            expect(providers).not.toContain({ provide: PARAMETERS_PARSER, useClass: DefaultParameterParser });
            expect(providers).not.toContain({ provide: TYPE_CASTER, useClass: DefaultTypeCaster });
            expect(providers).not.toContain({ provide: ARGS_PARSER, useClass: parserConfig });
            providers = ParserModule.forRoot({ typeCaster: null, options: null, arguments: null, parameters: null, config: null }).providers;
            expect(providers).not.toContain({ provide: ARGS_PARSER, useClass: DefaultArgumentsParser });
            expect(providers).not.toContain({ provide: OPTIONS_PARSER, useClass: DefaultOptionsParser });
            expect(providers).not.toContain({ provide: PARAMETERS_PARSER, useClass: DefaultParameterParser });
            expect(providers).not.toContain({ provide: TYPE_CASTER, useClass: DefaultTypeCaster });
            expect(providers).not.toContain({ provide: ARGS_PARSER, useClass: parserConfig });
        });

        it('Should return the provided implementation of the arguments parser whether it is provided as a value or a class', () => {
            const fakeParser = {
                parse: () => null
            };
            expect(ParserModule.forRoot({ arguments: fakeParser }).providers).toContain({ provide: ARGS_PARSER, useValue: fakeParser });
            expect(ParserModule.forRoot({ arguments: DefaultArgumentsParser }).providers).toContain({ provide: ARGS_PARSER, useClass: DefaultArgumentsParser });
        });

        it('Should return the provided implementation of the options parser whether it is provided as a value or a class', () => {
            const fakeParser = {
                parseOptions: () => []
            };
            expect(ParserModule.forRoot({ options: fakeParser }).providers).toContain({ provide: OPTIONS_PARSER, useValue: fakeParser });
            expect(ParserModule.forRoot({ options: DefaultOptionsParser }).providers).toContain({ provide: OPTIONS_PARSER, useClass: DefaultOptionsParser });
        });

        it('Should return the provided implementation of the parameters parser whether it is provided as a value or a class', () => {
            const fakeParser = {
                parseParameters: () => []
            };
            expect(ParserModule.forRoot({ parameters: fakeParser }).providers).toContain({ provide: PARAMETERS_PARSER, useValue: fakeParser });
            expect(ParserModule.forRoot({ parameters: DefaultParameterParser }).providers).toContain({ provide: PARAMETERS_PARSER, useClass: DefaultParameterParser });
        });

        it('Should return the provided implementation of the typecaster parser whether it is provided as a value or a class', () => {
            const fakeParser = {
                castOption: () => null,
                castParameter: () => null,
            };
            expect(ParserModule.forRoot({ typeCaster: fakeParser }).providers).toContain({ provide: TYPE_CASTER, useValue: fakeParser });
            expect(ParserModule.forRoot({ typeCaster: DefaultTypeCaster }).providers).toContain({ provide: TYPE_CASTER, useClass: DefaultTypeCaster });
        });

        it('Should return a merge config of the defaults and the provided config', () => {
            expect((ParserModule.forRoot({ config: { allowCommandsAfterOptions: true, ignoreUnknownOptions: true } }).providers[0] as ValueProvider).useValue)
                .toEqual({ ...parserConfig, allowCommandsAfterOptions: true, ignoreUnknownOptions: true });
        });
    });

    describe('validate()', () => {

        let optsSpyCall: OptsValidatorSpyCall;
        let paramsSpyCall: ParamsValidatorSpyCall;
        beforeEach(() => {
            buildTreeWithSubcommands(builder);
            optsSpyCall = MockParser.optionsValidatorSpy(optsValidator);
            paramsSpyCall = MockParser.paramsValidatorSpy(parmsValidator);
        });

        it('Should call the options validator for all command routes within the module, using the mapped options from the command route', () => {
            const moduleRef = builder
                .removeRoute(() => builder.getModule(1))
                .build()
                .root().moduleRef;
            paramsSpyCall();

            const mappedOpts = [];
            const spy = mappedOptsSpy(mappedOpts);
            const validatorSpy = optsSpyCall();
            parser.validate(moduleRef);

            expect(spy).toHaveBeenCalledTimes(2);
            expect(validatorSpy.calls.argsFor(0)[0]).toBe(mappedOpts);
            expect(validatorSpy.calls.argsFor(1)[0]).toBe(mappedOpts);

        });

        it('Should call the parameter validator for all command routes within the module, passing in the route\'s paramaters and command name', () => {
            const moduleRef = builder
                .removeRoute(() => builder.getModule(1))
                .call(() => builder.getCommand(0)
                    .addParameter('param1', { designType: String })
                ).build()
                .root().moduleRef;

            optsSpyCall(); mappedOptsSpy();
            const pararmsValidatorSpy = paramsSpyCall();

            parser.validate(moduleRef);
            expect(pararmsValidatorSpy.calls.argsFor(0)[0]).toBe(moduleRef.routes[0].command.parameters);
            expect(pararmsValidatorSpy.calls.argsFor(0)[1]).toBe(moduleRef.routes[0].path);
            expect(pararmsValidatorSpy.calls.argsFor(1)[0]).toBe(moduleRef.routes[1].command.parameters);
            expect(pararmsValidatorSpy.calls.argsFor(1)[1]).toBe(moduleRef.routes[1].path);
        });

        it('Should recursively call the validate function for all sub command modules, adding the module to the parents list before calling it', () => {
            const moduleRef = builder
                .addRoute(b => b.getModule(2))
                .build()
                .root().moduleRef;
            paramsSpyCall(); optsSpyCall();
            const spy = spyOn(parser, 'validate').and.callThrough();
            parser.validate(moduleRef);
            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy.calls.argsFor(1)[0]).toBe(builder.getModule(1).moduleRef);
            expect(spy.calls.argsFor(2)[0]).toBe(builder.getModule(2).moduleRef);
        });

    });

    describe('evalauteContext()', () => {

        beforeEach(() => {
            buildTreeWithSubcommands(builder);
        });

        const createContext = (ctx?: Partial<EvaluatedArgumentsContext>): EvaluatedArgumentsContext => {
            return {
                possibleCommands: [],
                options: [],
                possibleParameters: [],
                route: undefined,
                ...(ctx || {})
            };
        };

        it('Should parse the arguments through the argument parsing implementation when it recieves them as a raw string array', () => {
            const spy = spyOn(argsParser, 'parse').and.callFake(() => createContext());
            parser.evalauteContext(['10', '10'], []);
            expect(spy).toHaveBeenCalled();
            expect(spy.calls.mostRecent().args[0]).toEqual(['10', '10']);
        });

        it('Should not call the argument parsing implementation when it hasn\'t recieved raw args', () => {
            builder.build();
            const spy = spyOn(argsParser, 'parse').and.callFake(() => createContext());
            parser.evalauteContext(createContext(), []);
            expect(spy).not.toHaveBeenCalled();
        });

        it('Should not resolve a route when there are no possible commands and no star command', () => {
            expect(parser.evalauteContext(createContext(), builder.build().root().moduleRef.routes).route).toBe(undefined);
        });

        it('Should resolve a route when there are no possible commands but a no star command', () => {
            const moduleRef = builder
                .call(b => b.routeFor(b.getCommand(1)).updateOpts({ path: '*' }))
                .build()
                .root().moduleRef;
            expect(parser.evalauteContext(createContext(), moduleRef.routes).route).toBe(moduleRef.routes[1]);
        });

        it('Should never resolve a star command by its alias', () => {
            const moduleRef = builder
                .call(b => b.routeFor(b.getCommand(0)).updateOpts({ path: '*', alias: 'a' }))
                .call(b => b.routeFor(b.getCommand(1)).updateOpts({ path: 'a' }))
                .build()
                .root().moduleRef;
            expect(parser.evalauteContext(createContext({ possibleCommands: ['a'] }), moduleRef.routes).route).toBe(moduleRef.routes[1]);
        });

        it('Should resolve commands by their name', () => {
            const moduleRef = builder
                .call(b => b.routeFor(b.getCommand(0)).updateOpts({ path: 'create' }))
                .build()
                .root().moduleRef;
            expect(parser.evalauteContext(createContext({ possibleCommands: ['create'] }), moduleRef.routes).route).toBe(moduleRef.routes[0]);
        });

        it('Should resolve routes by their alias', () => {
            const moduleRef = builder
                .call(b => b.routeFor(b.getModule(1)).updateOpts({ alias: 'f' }))
                .build()
                .root().moduleRef;
            expect(parser.evalauteContext(createContext({ possibleCommands: ['f'] }), moduleRef.routes).route).toBe(moduleRef.routes[2]);
        });

        it('Should remove the resolved command from both the possible parameters and possible commands', () => {
            const moduleRef = builder
                .call(b => b.routeFor(b.getCommand(0)).updateOpts({ alias: 'db' }))
                .build()
                .root().moduleRef;

            const ctx = parser.evalauteContext(createContext({
                possibleCommands: ['db', 'update'],
                possibleParameters: ['db', 'update', 'name']
            }), moduleRef.routes);
            expect(ctx.possibleCommands).toEqual(['update']);
            expect(ctx.possibleParameters).toEqual(['update', 'name']);
        });


    });

    describe('evaluateOptions()', () => {

        it('Should call the option parsing implmentation with the options metadata taken from the route and return the result', () => {
            const route = buildTreeWithSubcommands(builder).build().routeFor(b => b.getCommand(0)).registeredRoute;

            const params = new MockParserParams([
                { name: '--test', argType: 'opt' },
                { name: '-m', argType: 'opt' }
            ]);

            const optsSpy = optsMetadataSpy(params.optionMetadata);
            const result = [{ value: '1', definition: params.optionMetadata[0] }];
            const spy = spyOn(optsParser, 'parseOptions').and.returnValue(result);
            expect(parser.evaulateOptions(route, params.argumentContext.options)).toBe(result);

            expect(spy.calls.mostRecent().args[0]).toEqual(params.optionMetadata);
            expect(spy.calls.mostRecent().args[1]).toBe(params.argumentContext.options);
            expect(optsSpy).toHaveBeenCalled();

        });
    });


    describe('evaulateParameters', () => {

        it('Should call the the parameter parsing implementation', () => {

            const params = new MockParserParams([
                { name: 'p1', argType: 'param' },
                { name: 'p1', argType: 'param' }
            ]);

            const result = params.parameterMetadata.map((o, i) => ({ definition: o, value: i }));
            const spy = spyOn(paramsParser, 'parseParameters').and.returnValue(result);

            expect(parser.evaulateParameters(params.parameterMetadata, ['param1', 'param2'])).toBe(result);
            expect(spy.calls.mostRecent().args[0]).toBe(params.parameterMetadata);
            expect(spy.calls.mostRecent().args[1]).toEqual(['param1', 'param2']);
        });
    });

});
