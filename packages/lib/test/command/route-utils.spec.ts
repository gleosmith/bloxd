import { MockCommand, MockModule, MockRoute } from '../shared';
import { Command, CommandRouteDefinition, SubModuleRouteDefinition, CommandOpts } from '../../src';
import { RouteUtils } from '../../src/internal/command/route-utils';

describe('RouteUtils[class]', () => {

    let route1: MockRoute;
    let route2: MockRoute;

    const registeredRoutes = () => {
        route1.register();
        route2.register();
    };

    beforeEach(() => {
        route1 = new MockRoute()
            .fromCommand(
                new MockCommand()
                    .setName('cmd')
                    .applyMetadata()
            );
        route2 = new MockRoute()
            .fromModule(new MockModule())
            .updateOpts({ path: 'p2' });
    });


    describe('isRoute()[static]', () => {

        it('Should return true if it recieves a route as a decorated command', () => {
            expect(RouteUtils.isRoute(route1.mockCommand.constructorRef)).toBeTrue();
        });

        it('Should return true if it recieves a command route definition', () => {
            expect(RouteUtils.isRoute(route1.route)).toBeTrue();
        });

        it('Should return true if it recieves a sub command route definition', () => {
            expect(RouteUtils.isRoute(route2.route)).toBeTrue();
        });

        it('Should return false if it recieves class that doesnt have command metadata', () => {
            expect(RouteUtils.isRoute(class OtherClass { })).toBeFalse();
        });

        it('Should return false if it a provider', () => {
            expect(RouteUtils.isRoute({ provide: '', useValue: '' })).toBeFalse();
        });

    });

    describe('checkForDuplicates()[static]', () => {

        it('Should throw an error if two or more command have the same name', () => {
            route2.updateOpts({ path: 'cmd' });
            registeredRoutes();
            expect(() => RouteUtils.checkForDuplicates([route1.registeredRoute, route2.registeredRoute], '')).toThrowError();
        });

        it('Should throw an error if two or more command have the same alias', () => {
            route1.updateOpts({ alias: 'true' });
            route2.updateOpts({ alias: 'true' });
            registeredRoutes();
            expect(() => RouteUtils.checkForDuplicates([route1.registeredRoute, route2.registeredRoute], '')).toThrowError();
        });

        it('Should not check for duplicates on unset aliases', () => {
            route2.updateOpts({ alias: '' });
            registeredRoutes();
            expect(() => RouteUtils.checkForDuplicates([route1.registeredRoute, route2.registeredRoute], '')).not.toThrowError();
        });

        it('Should not throw an error where there are no duplicates', () => {
            registeredRoutes();
            expect(() => RouteUtils.checkForDuplicates([route1.registeredRoute, route2.registeredRoute], '')).not.toThrowError();
        });

    });

    describe('getCommand()[static]', () => {

        it('Should return the command cosntructor when the route is a constructor', () => {
            expect(RouteUtils.getCommand(route1.mockCommand.constructorRef)).toBe(route1.mockCommand.constructorRef);
        });

        it('Should return the command constructor when the route is a command route definition', () => {
            expect(RouteUtils.getCommand(route1.updateOpts({ path: 'p' }).route)).toBe(route1.mockCommand.constructorRef);
        });

        it('Should return undefined when the route is a sub command route definition', () => {
            expect(RouteUtils.getCommand(route2.route)).toBe(undefined);
        });
    });

    describe('getModule()[static]', () => {

        it('Should return the module cosntructor when the route is a sub command route defintion', () => {
            expect(RouteUtils.getModule(route2.route)).toBe(route2.mockModule.constructorRef);
        });

        it('Should return the undefined when the route is a command route definition', () => {
            expect(RouteUtils.getModule(route1.updateOpts({ path: 'p' }).route)).toBe(undefined);
        });

        it('Should return undefined when the route is a command constructor', () => {
            expect(RouteUtils.getModule(route1.mockCommand.constructorRef)).toBe(undefined);
        });

    });

    describe('isCommand()[static]', () => {

        it('Should return  false when the route is a sub command route defintion', () => {
            expect(RouteUtils.isCommand(route2.route)).toBe(false);
        });

        it('Should return the true when the route is a command route definition', () => {
            expect(RouteUtils.isCommand(route1.updateOpts({ path: 'p' }).route)).toBe(true);
        });

        it('Should return true when the route is a command constructor', () => {
            expect(RouteUtils.isCommand(route1.mockCommand.constructorRef)).toBe(true);
        });

    });

    describe('getPath()[static]', () => {

        it('Should return the name from the command metadata if the route is command constructor', () => {
            expect(RouteUtils.getPath(route1.mockCommand.constructorRef)).toBe('cmd');
        });

        it('Should return the path from the route if the route is not command constructor', () => {
            expect(RouteUtils.getPath(route1.updateOpts({ path: 'p' }).route)).toBe('p');
            expect(RouteUtils.getPath(route2.route)).toBe('p2');
        });

    });

    describe('getAlias()[static]', () => {

        it('Should return the alias from the command metadata if the route is a command constructor', () => {
            expect(RouteUtils.getAlias(route1.mockCommand.updateOpts({ alias: 'a' }).applyMetadata().constructorRef)).toBe('a');
        });

        it('Should return the alias from the route if the route is not command constructor', () => {
            expect(RouteUtils.getAlias(route1.updateOpts({ alias: '1' }).route)).toBe('1');
            expect(RouteUtils.getAlias(route2.updateOpts({ alias: '2' }).route)).toBe('2');
        });

        it('Should return  the alias from the command constructor if the route is not a command constructor and the route\'s alias is undefined', () => {
            route1.mockCommand.updateOpts({ alias: 'c' }).applyMetadata();
            expect(RouteUtils.getAlias(route1.updateOpts({ path: 'p' }).route)).toBe(undefined);
        });

    });

    describe('getData()[static]', () => {

        it('Should return the data from the command metadata if the route is a command constructor', () => {
            expect(RouteUtils.getData(route1.mockCommand.updateOpts({ data: 10 }).applyMetadata().constructorRef)).toBe(10);
        });

        it('Should return the data from the route if the route is not a command constructor', () => {
            expect(RouteUtils.getData(route1.updateOpts({ data: 5 }).route)).toBe(5);
            expect(RouteUtils.getData(route2.updateOpts({ data: '5' }).route)).toBe('5');
        });

        it('Should take the data from the command constructor if the route is not a command constructor and the route\'s data is undefined', () => {
            route1.mockCommand.updateOpts({ data: 2000 }).applyMetadata();
            expect(RouteUtils.getData(route1.updateOpts({ path: 'p' }).route)).toBe(2000);
        });

    });

    describe('getDescription()[static]', () => {

        it('Should return the description from the command metadata if the route is a command constructor', () => {
            expect(
                RouteUtils.getDescription(route1.mockCommand.updateOpts({ description: 'some description' }).applyMetadata().constructorRef)
            ).toBe('some description');
        });

        it('Should return the description from the route if the route is not a command constructor', () => {
            expect(RouteUtils.getDescription(route1.updateOpts({ description: '1' }).route)).toBe('1');
            expect(RouteUtils.getDescription(route2.updateOpts({ description: '2' }).route)).toBe('2');
        });

        it('Should take the description from the command constructor if the route is not a command constructor and the route\'s description is undefined', () => {
            route1.mockCommand.updateOpts({ description: 'something' }).applyMetadata();
            expect(RouteUtils.getDescription(route1.updateOpts({ path: 'p' }).route)).toBe('something');
        });

    });

    describe('equal()[static]', () => {

        it('Should return true when the command contructors of two routes are equal', () => {
            route1.updateOpts({ path: 'p' });
            expect(RouteUtils.equal(route1.route, route1.mockCommand.constructorRef)).toBe(true);
            expect(RouteUtils.equal(route1.mockCommand.constructorRef, route1.route)).toBe(true);
            expect(RouteUtils.equal(route1.route, route1.route)).toBe(true);
            expect(RouteUtils.equal(route1.mockCommand.constructorRef, route1.mockCommand.constructorRef)).toBe(true);
        });

        it('Should return true when the command contructors of two routes are equal', () => {
            const route3 = new MockRoute()
                .fromModule(route2.mockModule)
                .updateOpts({ path: 'p3' });
            expect(RouteUtils.equal(route2.route, route3.route)).toBe(true);
        });

        it('Should return false when the commands or modules aren\'t equal or the one route is a command while the other is a module', () => {
            expect(RouteUtils.equal(route2.route, new MockRoute().fromCommand(new MockCommand()).route)).toBe(false);
            expect(RouteUtils.equal(route2.route, route1.route)).toBe(false);
            expect(RouteUtils.equal(route1.route, new MockCommand().applyMetadata().constructorRef)).toBe(false);
        });


    });

});
