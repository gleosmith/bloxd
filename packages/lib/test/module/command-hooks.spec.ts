import { BeforeExecute } from '../../src';
import { getMetadata, MetadataKey } from '../../src/internal/common/meta-data';
import { CommandHookDefinition, AfterExecute } from '../../src/internal/module/command-hooks';

class Command1 implements Command1 { execute() { } }
class Command2 implements Command1 { execute() { } }

describe('@BeforeExecute()[decorator]', () => {

    it('Should add metadata containing the decorated method\'s name and the commands', () => {
        class MockModule {
            @BeforeExecute([Command1])
            method1() {
            }
            @BeforeExecute([Command1, Command2])
            hook1() {
            }
        }
        expect(getMetadata<CommandHookDefinition[]>(MetadataKey.BeforeExecute, MockModule))
            .toEqual([{ methodName: 'method1', commands: [Command1] }, { methodName: 'hook1', commands: [Command1, Command2] }]);
    });

    it('Should set the commands metadata to an empty array when no commands are provided', () => {
        class MockModule {
            @BeforeExecute()
            hook2() {
            }
        }
        expect(getMetadata<CommandHookDefinition[]>(MetadataKey.BeforeExecute, MockModule)[0]).toEqual({ methodName: 'hook2', commands: [] });
    });

});

describe('@AfterExecute()[decorator]', () => {

    it('Should add metadata containing the decorated method\'s name and the commands', () => {
        class MockModule {
            @AfterExecute([Command2])
            afterHook() {
            }
        }
        expect(getMetadata<CommandHookDefinition>(MetadataKey.AfterExecute, MockModule)[0]).toEqual({ methodName: 'afterHook', commands: [Command2] });
    });

    it('Should set the commands metadata to an empty array when no commands are provided', () => {
        class MockModule {
            @AfterExecute()
            afterHook1() {
            }

            @AfterExecute([Command1])
            afterHook2() {
            }
        }
        expect(getMetadata<CommandHookDefinition[]>(MetadataKey.AfterExecute, MockModule))
            .toEqual([{ methodName: 'afterHook1', commands: [] }, { methodName: 'afterHook2', commands: [Command1] }]);
    });

});
