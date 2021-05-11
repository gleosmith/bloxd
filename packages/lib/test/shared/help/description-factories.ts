import { ModuleDescription } from '../../../src/internal/module/module-models';
import { CommandDescription, ParameterDescription, OptionDescription, ParameterDefinition, OptionDefinition } from '../../../src';
import { RegisteredRoute } from '../../../src/internal/command/registered-route';


export const createParameterDescription = (
    des: Partial<ParameterDescription>
): ParameterDescription => ({
    name: undefined,
    data: undefined,
    optional: false,
    isArray: false,
    description: undefined,
    designType: undefined,
    index: undefined,
    ...des
});

export const paramDescriptionFromMetadata = (
    description: ParameterDefinition
): ParameterDescription => ({
    name: description.name,
    index: description.index,
    designType: description.designType,
    isArray: false,
    optional: description.optional,
    data: description.data,
    description: description.description
});

export const optDescriptionFromMetadata = (
    description: OptionDefinition
): OptionDescription => ({
    name: description.name,
    alias: description.alias,
    designType: description.designType,
    required: description.required,
    data: description.data,
    description: description.description
});


export const createOptionDescription = (
    des: Partial<OptionDescription>
): OptionDescription => ({
    name: undefined,
    data: undefined,
    alias: undefined,
    required: false,
    description: undefined,
    designType: undefined,
    ...des
});

export const commandDescriptionFromRoute = (
    route: RegisteredRoute,
    des: Partial<CommandDescription>
): CommandDescription => ({
    name: route.path,
    description: route.description,
    alias: route.alias,
    parameters: [],
    parent: undefined,
    options: [],
    data: route.data,
    ...des
});


export const moduleDescriptionFromRoute = (
    route: RegisteredRoute,
    des: Partial<ModuleDescription>
): ModuleDescription => ({
    name: route.path,
    alias: route.alias,
    description: route.description,
    subCommands: [],
    parent: undefined,
    commands: [],
    data: route.data,
    ...des
});

export const createModuleDescription = (
    des: Partial<ModuleDescription>
): ModuleDescription => ({
    name: undefined,
    alias: undefined,
    subCommands: [],
    parent: undefined,
    commands: [],
    data: undefined,
    ...des
});

export const createCommandDescription = (
    des: Partial<CommandDescription>
): CommandDescription => ({
    parent: undefined,
    name: undefined,
    alias: undefined,
    description: undefined,
    data: undefined,
    parameters: [],
    options: [],
    ...des
});
