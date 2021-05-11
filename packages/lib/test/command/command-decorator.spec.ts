import { CommandDefinition, Command } from '../../src/internal/command/command-models';
import { getMetadata, MetadataKey } from '../../src/internal/common/meta-data';
import * as di from '../../src/internal/dependency-injection/injectable-arg-definition';
import { MockCommand, ClassDecoratorCall, MockModule, MockOptions } from '../shared';


interface MockCommandModel {
    execute: () => void;
}

describe('@CliCommand()[decorator]', () => {

    let command: MockCommand<MockCommandModel>;
    let applyCommandDecorator: ClassDecoratorCall;
    beforeAll(() => {
        command = new MockCommand()
            .setName('test')
            .addFunction('execute', () => { });
        applyCommandDecorator = command.createClassDecoratorCall();
    });

    it('Should register the class decorator for dependency injection', () => {
        const spy = spyOn(di, 'registerInjectablesArgs');
        applyCommandDecorator(command.commandDecorator());
        expect(spy).toHaveBeenCalledWith(command.constructorRef);
    });

    it('Should set default command metadata if no decorator options have been provided', () => {
        applyCommandDecorator(command.removeOptions(command.mockOptions[0]).commandDecorator());
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).name).toBe(command.name);
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).description).toBe(undefined);
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).alias).toBe(undefined);
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).constructor).toBe(command.constructorRef);
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).data).toBe(undefined);
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).options).toEqual([]);
    });

    it('Should set the command metadata with the provided opts', () => {
        applyCommandDecorator(command.commandDecorator({ description: 'A description', alias: 't', data: [17] }));
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).description).toBe('A description');
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).alias).toBe('t');
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).data).toEqual([17]);
    });

    it('Should always convert cli options into an array of option constructors', () => {
        applyCommandDecorator(
            command
                .addOptions(new MockOptions())
                .commandDecorator({ options: command.options[0] })
        );
        expect(getMetadata<CommandDefinition>(MetadataKey.Command, command.constructorRef).options).toEqual([command.options[0]]);
    });

});
