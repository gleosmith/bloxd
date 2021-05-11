
export const symbol1 = Symbol('token1');
export const symbol2 = Symbol('token2');
export const symbol3 = Symbol('token3');
export const symbol4 = Symbol('token4');
export const symbol5 = Symbol('token5');

export class EmptyClass1 { }
export class EmptyClass2 { }
export class EmptyClass3 { }

export const asyncThrowsError = async (fn: () => Promise<any>) => {
    try {
        await fn();
        return false;
    } catch (e) {
        return true;
    }
};
