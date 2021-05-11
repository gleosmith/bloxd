import { hasInjectableArgs, getInjectablesArgs, InjectableArgDefinition } from '../../src/internal/dependency-injection/injectable-arg-definition';
import { getMetadata, MetadataKey } from '../../src/internal/common/meta-data';
import { MockInjectable, ParamDecoratorCall, ClassDecoratorCall, MockClassProvider, MockValueProvider, symbol1 } from '../shared';
import { Injectable, Inject } from '../../src';


describe('DI[functions]', () => {

    let injectable: MockInjectable;
    let applyClassDecorator: ClassDecoratorCall;
    let applyParamDecorator: ParamDecoratorCall;
    beforeEach(() => {
        injectable = new MockInjectable()
                        .addConstructorParam(new MockClassProvider())
                        .addConstructorParam(new MockClassProvider());
        applyClassDecorator = injectable.createClassDecoratorCall();
        applyParamDecorator = injectable.createParamDecoratorCall();
    });

    describe('hasInjectables()', () => {

        it('Should return true if contructor has arguments with injectable metadata', () => {
            expect(hasInjectableArgs(injectable.applyMetadata().constructorRef)).toEqual(true);
        });

        it('Should return false when a constructor does not have any arguments with injectable metadata', () => {
            expect(hasInjectableArgs(injectable.constructorRef)).toEqual(false);
        });

    });

    describe('getInjectables()', () => {

        it('Should return the injectable argument metadata from a constructor with the specified key', () => {
            expect(
                MockInjectable.sort(getInjectablesArgs(injectable.applyMetadata().constructorRef))
            ).toEqual(MockInjectable.sort(injectable.injectableMetadata));
        });

        it('Should return an undefined array where a constructor has no argument metadata', () => {
            expect(getInjectablesArgs(injectable.constructorRef)).toBe(undefined);
        });

    });

    describe('registerInjectableArgs()', () => {

        it('Should read the constructor\'s argument metadata with each argument\'s positional index and design type', () => {
            applyClassDecorator(Injectable());
            const x = MockInjectable.sort(getMetadata<InjectableArgDefinition[]>(MetadataKey.InjectableArgs, injectable.constructorRef));
            expect(
                MockInjectable.sort(getMetadata<InjectableArgDefinition[]>(MetadataKey.InjectableArgs, injectable.constructorRef))
            ).toEqual(MockInjectable.sort(injectable.injectableMetadata));
        });

        it('Should not overwrite any argument metadata that was been created from a parameter decorator', () => {
            injectable.addConstructorParam(new MockValueProvider(symbol1, 20), Number);
            applyParamDecorator(Inject(symbol1), 2);
            applyClassDecorator(Injectable());
            expect(
                MockInjectable.sort(getMetadata<InjectableArgDefinition[]>(MetadataKey.InjectableArgs, injectable.constructorRef))
            ).toEqual(MockInjectable.sort(injectable.injectableMetadata));
        });
    });

});
