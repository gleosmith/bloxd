import { Injectable } from '../../src';
import * as di from '../../src/internal/dependency-injection/injectable-arg-definition';
import { MockClass } from '../shared';
import { getMetadata, MetadataKey } from '../../src/internal/common/meta-data';
import { InjectableOpts } from '../../src/internal/dependency-injection/injectable-decorator';

describe('@Injectable()[decorator]', () => {

    it('Should register the class constructor for dependency injection', () => {
        const injectable = new MockClass();
        const spy = spyOn(di, 'registerInjectablesArgs');
        injectable.createClassDecoratorCall()(Injectable());
        expect(spy.calls.mostRecent().args[0]).toBe(injectable.constructorRef);
    });

    it('Should set the providers global metadata to false if not provided', () => {
        const injectable = new MockClass();
        injectable.createClassDecoratorCall()(Injectable());
        expect(getMetadata<InjectableOpts>(MetadataKey.Provider, injectable.constructorRef).global).toBe(false);
    });

    it('Should set the providers global metadata to true when declared as true', () => {
        const injectable = new MockClass();
        injectable.createClassDecoratorCall()(Injectable({global: true}));
        expect(getMetadata<InjectableOpts>(MetadataKey.Provider, injectable.constructorRef).global).toBe(true);
    });

    it('Should set the providers singleton metadata to true if not provided', () => {
        const injectable = new MockClass();
        injectable.createClassDecoratorCall()(Injectable());
        expect(getMetadata<InjectableOpts>(MetadataKey.Provider, injectable.constructorRef).singleton).toBe(true);
    });

    it('Should set the providers singleton metadata to false when declared as false', () => {
        const injectable = new MockClass();
        injectable.createClassDecoratorCall()(Injectable({singleton: false}));
        expect(getMetadata<InjectableOpts>(MetadataKey.Provider, injectable.constructorRef).singleton).toBe(false);
    });

});
