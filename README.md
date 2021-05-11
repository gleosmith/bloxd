A modular framework for developing command line interfaces in TypeScript

# Official Documentation

Find the official documentation [here](https://bloxd.dev)

# Introduction

The Bloxd framework aims to simplify the development of Node.js command line interfaces (CLI) with [TypeScript](https://www.typescriptlang.org/). The framework decomposes a command line application into its various components, bringing them together through modules to create a structured pattern for your app. The approach is similar to the popular [Angular](https://angular.io/) and [NestJS](https://nestjs.com/) frameworks. 

Bloxd has been designed to be customizable, with some its core functionality such argument parsing and displaying help messages interchangeable with customized behaviour. Additionally, the framework has its own CLI to add to your productivity and assist in developing, building, packaging and scaffolding projects. 

So, if you're looking to build a well-formed enterprise solution, focusing on strong design patterns with a rich set of features and customizations, then Bloxd is for you. If you want a quick and dirty solution, I don't care about the detail, I just need to build a CLI quickly, then Bloxd is also for you with the ability to get going in minutes...

```
> npm install bloxd-cli -g
> bloxd new app
> cd ./app
> bloxd run 'hello' --watch
```

## Useful Links

- [Creating your First App](https://bloxd.dev/guide/first-app.html)

## The building blocks

### Modules

[Modules](https://bloxd.dev/guide/modules.html) are the foundational structures of an application, grouping numerous components to either create logical sub-commands within your app or create containers of shared functionality. Modules are also "executed" within the application lifecycle, meaning they expose [hooks](https://bloxd.dev/guide/modules.html#command-hooks) to implement behaviour before or after the underlying commands are executed and can also inject [providers](https://bloxd.dev/guide/providers.html) within their constructors. There are two special modules shipped within the framework:
- [ParserModule](https://bloxd.dev/guide/parser.html) to process and validate the raw CLI arguments. The default parsing behaviour can be interchanged with custom implementations if required. The ParserModule
- [HelpModule](https://bloxd.dev/guide/help.html) to display informative messages to the app user when certain errors are thrown indicating that the CLI was not used correctly. The implementation of the help module is customizable. 
```ts
import { CliModule, ParserModule, HelpModule, BeforeExecute } from 'bloxd';

@CliModule({
    commands: [ 
        FindCommand, 
        ReplaceCommand
    ],
    options: [ 
        SearchOptions 
    ],
    providers: [ 
        SearchService,
        AppSettings
    ],
    imports: [ 
        ParserModule,
        HelpModule
    ]
})
export class AppModule {

    constructor(private appSettings: AppSettings) {
         this.appSettings.readGlobalSettings();
    }

    @BeforeExecute([FindCommand, ReplaceCommand])
    async doSomething() {}

}
```

### Commands

[Commands](https://bloxd.dev/guide/commands.html) represent the functions that are called via the app. Typically, commands are identified by a name or alias in the call signature, although there are some exceptions. Commands also typically take in certain [parameters](https://bloxd.dev/guide/parameters.html) and/or [options](https://bloxd.dev/guide/options.html) to implement and modify their functionality.

Commands can be declared directly within a module's metadata, or they can be described as a command route. Command routes enable the ability to change some of the metadata for the command and also allow the declaration of [sub-command modules](https://bloxd.dev/guide/commands.html#_2-commands-within-sub-command-modules-sub-commands).

```
<cli> *<command>* [options] [<parameters>]
```

```ts
import { CliCommand, Command, CliParameter, CliModule } from 'bloxd';

@CliCommand('replace', {
    alias: 'r',
    description: 'Finds text and repaces it if found',
    options: [ReplaceOptions]
})
export class ReplaceCommand implements Command {

    @CliParameter(1, {
        description: 'Text to find'
    })
    searchText: string;

    @CliParameter(2, {
        description: 'Text used to replace'
    })
    replaceText: string;

    constructor(
        private searchOpts: SearchOptions, 
        private searchService: SearchService,
        private replaceOpts: ReplaceOptions
    ) {}

    async execute() {
        // implement requirement
    }

}

@CliModule({
    commands: [
        ReplaceCommand,
        { path: 'search', command: SearchCommand }
    ]
})
export class AppModule {}
```

### Parameters

[Parameters](https://bloxd.dev/guide/parameters.html) are positional CLI arguments passed into a command and as such are declared as decorated properties of the command class. Because parameters are positional, each is described with an index. It is also possible to declare array parameters which allows for an undetermined number of arguments to be supplied in the command’s call signature.

When declaring a parameter, its' design type whether it be a string, number or some other type, is important as the default implementation of the [ParserModule](https://bloxd.dev/guide/parser.html)  has mechanisms to validate the user input against the specified type before binding it to the command. 

```
<cli> <command> *param1* *param2* [options]
```

```ts
import { CliCommand, Command, CliParameter } from 'bloxd';

@CliCommand('install', {
    alias: 'i',
    description: 'Installs packages',
})
export class InstallCommand implements Command {

    @CliParameter(1, {
        description: 'Text used to replace'
    })
    packages: string[];

    constructor() {}

    execute() {}

}
```

### Options

[Options](https://bloxd.dev/guide/options.html) are non-positional CLI arguments and therefore are identified with a name `--version` or alias `-v` within the call signature. Bloxd doesn't associate options directly with commands but rather creates a separate layer called an options container. 

The options container is class containing a set of option properties, allowing the same options to be used for various commands. Option containers can be declared within the metadata of a commands and/or modules. When declared in a module those options become applicable to all commands and sub-commands within that module. Option containers then become injectable into the constructors of the commands and/or modules that reference them. The containers expose a [hook](https://bloxd.dev/guide/options.html#afteroptionsinit-hook) to implement logic such as additional validation. This occurs prior to the command/s being executed. Option containers can also inject [providers](https://bloxd.dev/guide/providers.html) within their constructors to utilize shared functionality.

Like parameters, the design type of an option is important. Options declared as booleans will not expect a value in the call signature `<cli> build --prod`, while other types will expect values `<cli> build --name app` | `<cli> build --name=app`.

```
<cli> <command> [<parameters>] -opt1 --opt2=value
```

```ts
import { CliOptions, CliOption, AfterOptionsInit, OptionParsingError, CliCommand, Command } from 'bloxd';

@CliOptions()
export class BuildOptions implements AfterOptionsInit {

    @CliOption({
        alias: 'p',
        description: 'Minifies the scripts'
    })
    prod: boolean;

    @CliOption({
        alias: 't',
        description: 'The target platform (node, electron or browser). Defaults to node'
    })
    target: string = 'node';

    private readonly targets = ['node', 'electron', 'browser'];

    constructor() {}

    afterOptionsInit() {
        if(!this.targets.find(t => t === this.target)) {
            throw new OptionParsingError(`The target ${this.target} is not valid. Only accepts ${this.targets.join(', ')}`);
        }
    }

}

@CliCommand('build', {
    alias: 'b',
    description: 'Builds the package',
    options: [BuildOptions]
})
export class BuildCommand implements Command {

    constructor(private opts: BuildOptions) {}

    execute() {
        // implement build logic using options
    }

}
```

### Providers

[Providers](https://bloxd.dev/guide/providers.html) are a means of sharing functionality or values across various components using [dependency injection](https://bloxd.dev/guide/modules.html#modules-and-dependency-injection). There are three different types of providers:
- **Class providers** - an instance of a class is injected into the constructor reference. The classes themselves can also inject other providers into their constructors.
- **Factory providers** - a factory function is executed to resolve the value of the provider before it is injected into the constructor reference
- **Value provider** - a simple value is injected into each constructor reference

Providers are referenced in the constructor arguments using inject tokens. For class providers, the token is simply the class type. For factory and/or value providers a token needs to be explicitly created and used in the constructor's argument via the [@Inject()](https://bloxd.dev/guide/providers.html#inject-tokens) decorator. For classes that are not already decorated with a specific Bloxd decorator, such as `@CliCommand()`, `@CliOptions()` or `@CliModule()`, the [@Injectable](https://bloxd.dev/guide/providers.html#injectable-decorator) must be utilized to reference other class providers within its constructor without using the `@Inject()` token.

Providers are typically declared in modules to be shared across that module's components. However, they can also be declared in the metadata of the individual components such as commands or option containers, in which case a new reference of that provider will be created for that specific component.

```ts
import { Injectable, Inject, CliModule } from 'bloxd';

export const HTTP_CONFIG = Symbol('COMMAND_HELP');

@Injectable()
export class AuthService {

    constructor(
        private http: HttpService,
        @Inject(HTTP_CONFIG) private config: HttpConfig
    ) {}

    async login() {
       await this.http.post(`${this.config.baseUrl}oauth/token`)
    }

}

@CliModule({
    providers: [
        HttpService,
        AuthService,
        { provide: HTTP_CONFIG, useValue: { baseUrl: 'https://example.com/' }}
    ]
})
export class AppModule {}
```