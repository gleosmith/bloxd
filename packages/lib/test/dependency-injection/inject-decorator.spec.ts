import { getMetadata, MetadataKey } from '../../src/internal/common/meta-data';
import { InjectableArgDefinition } from '../../src/internal/dependency-injection/injectable-arg-definition';
import { MockInjectable, MockValueProvider, symbol1, MockClass } from '../shared';
import { Inject } from '../../src';


describe('@Inject()[decorator]', () => {

    it('Should add injectable metadata for the decorated argument, containing the index and injectToken', () => {
        const injectable = new MockInjectable()
            .addConstructorParam(new MockValueProvider(symbol1, 10), Number)
            .addConstructorParam(new MockValueProvider(MockClass, 'string'), MockClass);
        injectable.createParamDecoratorCall()(Inject(injectable.getInjectableMockProvider(0).token), 0);
        injectable.createParamDecoratorCall()(Inject(injectable.getInjectableMockProvider(1).token), 1);
        expect(
            MockInjectable.sort(getMetadata<InjectableArgDefinition[]>(MetadataKey.InjectableArgs, injectable.constructorRef))
        ).toEqual([injectable.getInjectableMetadata(0), injectable.getInjectableMetadata(1)]);
    });

});
