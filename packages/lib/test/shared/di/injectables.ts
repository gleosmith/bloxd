
import { MockClass } from '../common/mock-class';
import { InjectableArgDefinition } from '../../../src/internal/dependency-injection/injectable-arg-definition';

export class MockInjectable<T = any> extends MockClass<T> {

    static sort(metadata: InjectableArgDefinition[]) {
        return metadata.sort((prev, cur) => prev.index > cur.index ? 1 : -1);
    }

    constructor() {
        super();
    }

}
