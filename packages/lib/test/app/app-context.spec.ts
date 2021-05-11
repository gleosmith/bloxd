import * as path from 'path';
import { AppContext } from './../../src';
import * as process from 'process';

describe('AppContext', () => {

    const joinSpy = (returnValue: string) => {
        return spyOn(path, 'join').and.returnValue(returnValue);
    };

    let ctx: AppContext;
    beforeEach(() => {
        ctx = new AppContext('name', 'version1');
    });

    describe('constructor()', () => {
        it('Should set the name', () => {
            expect(ctx.name).toBe('name');
        });
        it('Should set the version', () => {
            expect(ctx.version).toBe('version1');
        });
    });

    describe('relativeToCwd()', () => {
        it('Should join the provided path with the cwd', () => {
            const spy = joinSpy('cwd-joined');
            const result = ctx.relativeToCwd('./somepath');
            expect(spy).toHaveBeenCalledWith(process.cwd(), './somepath');
            expect(result).toBe('cwd-joined');
        });
    });

    describe('relativeToCli()', () => {
        it('Should join the provided path with the path of the cli', () => {
            const spy = joinSpy('cli-joined');
            const result = ctx.relativeToCli('./somepath');
            expect(spy.calls.argsFor(0)).toEqual([process.argv[1], '../']);
            expect(spy.calls.argsFor(1)).toEqual(['cli-joined', './somepath']);
            expect(result).toBe('cli-joined');
        });
    });

});
