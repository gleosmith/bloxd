import { asyncThrowsError } from './../shared/common/utils';
import { ErrorHandler, ERROR_HANDLER } from './../../src/internal/app/error-handler';
import { ProviderUtils } from './../../src/internal/dependency-injection/provider-utils';
import { ValueProviderRef } from './../../src/internal/dependency-injection/provider-refs/value-provider-ref';
import { CLI_NAME, CLI_VERSION, AppContext } from './../../src/internal/app/app-context';
import { GlobalComponentsRegistry } from './../../src/internal/app/global-components-registry';
import { MockModule } from './../shared/module/mock-module';
import { CliApp } from './../../src/internal/app/cli-application';
import { Type } from '../../src/internal/common/cli-types';

declare var __BLOXD_CLI_NAME__: string;
declare var __BLOXD_CLI_VERSION__: string;


describe('CliApplication', () => {


    let app: CliApp;
    let rootMod: MockModule;
    beforeEach(() => {
        rootMod = MockModule.simpleModuleWithProviders().applyMetadata();
        app = new CliApp(rootMod.constructorRef);
    });

    afterEach(() => {
        (global as any).__BLOXD_CLI_NAME__ = undefined;
        (global as any).__BLOXD_CLI_VERSION__ = undefined;
    });

    describe('constructor()', () => {


    });

    describe('withGlobalProvider()', () => {

        it('Should register a provider reference within the global registry using the provider reference factory', () => {
            const providerRef = new ValueProviderRef('TOKEN', 10, true);
            const factorySpy = spyOn(ProviderUtils, 'toProviderRef').and.returnValue(providerRef);
            class MockClass { }
            const spy = spyOn(GlobalComponentsRegistry.prototype, 'registerProvider');
            app.withGlobalProvider(MockClass);
            expect(factorySpy.calls.argsFor(0)[0]).toBe(MockClass);
            expect(spy).toHaveBeenCalledWith(providerRef);
        });

    });


    describe('setErrorHandler()', () => {
        it('Should register a constructor provider in the global provider scope when a constructor is provided', () => {
            class MyErrorHandler {
                onError(err: Error) { }
            }
            const spy = spyOn(app, 'withGlobalProvider');
            app.setErrorHandler(MyErrorHandler);
            expect(spy).toHaveBeenCalledWith({ provide: ERROR_HANDLER, useClass: MyErrorHandler });
        });

        it('Should register a value provider in the global provider scope when a constructor is provided', () => {
            const handler = {
                onError(err: Error) { }
            };
            const spy = spyOn(app, 'withGlobalProvider');
            app.setErrorHandler(handler);
            expect(spy).toHaveBeenCalledWith({ provide: ERROR_HANDLER, useValue: handler });
        });
    });


    describe('execute()', () => {


        it('Should register the APP_NAME in the global provider scope with the default value "cli" where a enviroment variable does not exist and the setName method has not been set', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(rootMod.moduleRef, 'validate');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);
            const spy = spyOn(CliApp.prototype, 'withGlobalProvider');
            app.execute();
            expect(spy).toHaveBeenCalledWith({ provide: CLI_NAME, useValue: 'cli' });
        });

        it('Should register the APP_NAME in the global provider scope with the global variable when it exists', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(rootMod.moduleRef, 'validate');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);
            const spy = spyOn(CliApp.prototype, 'withGlobalProvider');
            (global as any).__BLOXD_CLI_NAME__ = 'acb';
            await app.execute();
            expect(spy).toHaveBeenCalledWith({ provide: CLI_NAME, useValue: 'acb' });
        });

        it('Should register the APP_NAME in the global provider scope with the value set through the setName method', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(rootMod.moduleRef, 'validate');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);

            const spy = spyOn(CliApp.prototype, 'withGlobalProvider');
            (global as any).__BLOXD_CLI_NAME__ = 'acb';
            await app.setName('new-name').execute();
            expect(spy).toHaveBeenCalledWith({ provide: CLI_NAME, useValue: 'new-name' });
        });


        it('Should register the APP_VERSION in the global provider scope with the default value "1.0.0" where a enviroment variable does not exist and the setVersion method has not been set', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(rootMod.moduleRef, 'validate');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);

            const spy = spyOn(CliApp.prototype, 'withGlobalProvider');
            await app.execute();
            expect(spy).toHaveBeenCalledWith({ provide: CLI_VERSION, useValue: '1.0.0' });
        });

        it('Should register the APP_VERSION in the global provider scope with the global variable when it exists', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(rootMod.moduleRef, 'validate');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);

            const spy = spyOn(CliApp.prototype, 'withGlobalProvider');
            (global as any).__BLOXD_CLI_VERSION__ = '2.a.1';
            await app.execute();
            expect(spy).toHaveBeenCalledWith({ provide: CLI_VERSION, useValue: '2.a.1' });
        });

        it('Should register the APP_VERSION in the global provider scope with the value set through the setVersion method', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(rootMod.moduleRef, 'validate');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);

            const spy = spyOn(CliApp.prototype, 'withGlobalProvider');
            (global as any).__BLOXD_CLI_VERSION__ = '300';
            await app.setVersion('new-version').execute();
            expect(spy).toHaveBeenCalledWith({ provide: CLI_VERSION, useValue: 'new-version' });
        });

        it('Should register the AppContext in the global provider scope', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(rootMod.moduleRef, 'validate');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);
            const spy = spyOn(CliApp.prototype, 'withGlobalProvider');
            await app.execute();
            expect(spy).toHaveBeenCalledWith(AppContext);
        });

        it('Should register the root module as a command module in the registry', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(rootMod.moduleRef, 'validate');
            const spy = spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);
            await app.execute();
            expect(spy).toHaveBeenCalledWith(rootMod.constructorRef, null);
        });

        it('Should call the resolveOptions method of the registry', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(rootMod.moduleRef, 'validate');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);
            const spy = spyOn(GlobalComponentsRegistry.prototype, 'resolveOptions');
            await app.execute();
            expect(spy).toHaveBeenCalled();
        });

        it('Should validate the root module', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'execute');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);
            const spy = spyOn(rootMod.moduleRef, 'validate');
            await app.execute();
            expect(spy).toHaveBeenCalled();
        });

        it('Should call execute on the root module', async () => {
            rootMod.createModuleRef();
            spyOn(rootMod.moduleRef, 'validate');
            const spy = spyOn(rootMod.moduleRef, 'execute');
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.returnValue(rootMod.moduleRef);
            await app.execute();
            expect(spy).toHaveBeenCalled();
        });

        it('Should catch any errors within the error handling behavior if provided', async () => {
            const error = new Error();
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.throwError(error);
            const handler = {
                onError(err: Error) { }
            };
            const spy = spyOn(handler, 'onError');
            app.setErrorHandler(handler);
            await app.execute();
            expect(spy).toHaveBeenCalledWith(error);
        });


        it('Should not catch errors if no error handling behavior is provided', async () => {
            const error = new Error();
            spyOn(GlobalComponentsRegistry.prototype, 'registerCommandModule').and.throwError(error);
            expect(await asyncThrowsError(async () => await app.execute())).toEqual(true);
        });

    });


});
