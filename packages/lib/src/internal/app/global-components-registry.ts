import { ProviderRef } from '../dependency-injection/provider-refs/provider-ref';
import { RegisteredModule } from './registered-module';
import { CliBuildError, Type } from '../common/cli-types';
import { ConfiguredModule } from '../module/module-models';
import { ModuleRef } from '../module/module-ref';
import { isConstructor, removeDuplicates, validateUniqueValues } from '../common/utils';
import { ProviderUtils } from '../dependency-injection/provider-utils';
import { CommandRef } from '../command/command-ref';
import { Command } from '../command/command-models';
import { OptionsLink } from '../options/options-link';
import { OptionsProviderRef } from '../options/option-provider-ref';

/**
 * A registery for application components including global dependency injection scope, used for validation and the implementation
 * of singleton shared modules.
 */
export class GlobalComponentsRegistry {

    /**
     * Global provider scope
     */
    readonly providers: ProviderRef[] = [];

    /**
     * List of modules imported into other modules in the applciation graph
     */
    private sharedModules: RegisteredModule[] = [];

    /**
     * List of modules utilized within command routes in the application grapgh
     */
    private commandModules: RegisteredModule[] = [];

    /**
     * List of commands utilized in the application graph
     */
    private commands: CommandRef[] = [];

    /**
     * List of options registered in the application graph
     */
    private optionLinks: OptionsLink[] = [];

    /**
     * Creates a new registery
     */
    constructor() {
    }

    /**
     * Registers a module instance of a command module and returns this instance. If the module already exists
     * it will through an error. Throws an error where the module already exists as a shared module
     * @param mod Module contructor or configured module
     */
    registerCommandModule(
        mod: Type<any> | ConfiguredModule,
        parent: ModuleRef
    ): ModuleRef {
        const constructorRef = isConstructor(mod) ? mod as Type<any> : (mod as ConfiguredModule).module;
        if (this.sharedModules.find(m => m.constructorRef === constructorRef)) {
            throw new CliBuildError(`The module ${constructorRef.name} can't be used as both a shared module and a command module`);
        }
        if (!this.commandModules.find(m => m.constructorRef === constructorRef)) {
            const moduleRef = new ModuleRef(constructorRef, this, parent, !isConstructor(mod) ? mod as ConfiguredModule : undefined);
            this.commandModules.push({ moduleRef, configured: !isConstructor(mod), constructorRef });
            return moduleRef;
        } else {
            throw new CliBuildError(`The module ${constructorRef.name} has been used as a command module more than once`);
        }
    }

    /**
     * Registers a module instance of a command module and returns this instance. If the module already exists
     * it return the existing instance. When a configured module it will always create a new module instance. Throws an error where
     * the module already exists as a command module
     * @param mod Module constructor or configured module
     */
    registerSharedModule(mod: Type<any> | ConfiguredModule) {
        let moduleRef: ModuleRef;
        const constructorRef = isConstructor(mod) ? mod as Type<any> : (mod as ConfiguredModule).module;
        if (this.commandModules.find(m => m.constructorRef === constructorRef)) {
            throw new CliBuildError(`The module ${constructorRef.name} can't be used as both a shared module and a command module`);
        }
        if (isConstructor(mod)) {
            const exisiting = this.sharedModules.find(m => !m.configured && m.constructorRef === mod);
            if (exisiting) {
                return exisiting.moduleRef;
            } else {
                mod = mod as Type<any>;
                moduleRef = new ModuleRef(mod, this, undefined);
                this.sharedModules.push({ moduleRef, constructorRef: mod as Type<any>, configured: false });
            }
        } else {
            mod = mod as ConfiguredModule;
            moduleRef = new ModuleRef(mod.module, this, undefined, mod);
            this.sharedModules.push({ moduleRef, constructorRef: mod.module, configured: true });
        }
        return moduleRef;
    }

    /**
     * Registers a provider in the global scope and throws an error if a provider already exists with the same token
     * @param provider provider to include in the global scope
     */
    registerProvider(provider: ProviderRef) {
        if (!this.providers.find(p => p.injectToken === provider.injectToken)) {
            this.providers.push(provider);
        } else {
            throw new CliBuildError(`The provider ${ProviderUtils.providerName(provider.injectToken)} has been declared in the global scope more than once`);
        }
    }

    /**
     * Registers a provider in the global scope and replaces it if it already exists
     * @param provider provider to include in the global scope
     */
    registerOrReplaceProvider(provider: ProviderRef) {
        const exisiting = this.providers.find(p => p.injectToken === provider.injectToken)
        if (!exisiting) {
            this.providers.push(provider);
        } else {
            this.providers.splice(this.providers.indexOf(exisiting), 1, provider)
        }
    }


    /**
     * Registeres a command instance and returns the instance. Throws an error where the command has already been instantiated
     * @param constructorRef Constructor of the command
     * @param parent parent module of the command
     */
    registerCommand(constructorRef: Type<Command>, parent: ModuleRef) {
        if (!this.commands.find(c => c.constructorRef === constructorRef)) {
            const commandRef = new CommandRef(constructorRef, this.providers, parent, this);
            this.commands.push(commandRef);
            return commandRef;
        } else {
            throw new CliBuildError(`The command ${constructorRef.name} has been declared more than once`);
        }
    }

    /**
     * Registers an options container and returns a loink which allows the dependency injection scope of the options to be determined at
     * a later stage
     * @param constructorRef Contrcutor of the options container
     * @param moduleRef the closest parent module of the options container reference
     */
    registerOptions(constructorRef: Type<any>, moduleRef: ModuleRef) {
        const exisiting = this.optionLinks.find(o => o.constructorRef === constructorRef && moduleRef === o.moduleRef);
        if (!exisiting) {
            this.optionLinks.push({ constructorRef, moduleRef, providerRef: null });
            return this.optionLinks[this.optionLinks.length - 1];
        }
        return exisiting;
    }

    /**
     * Creates the option provider reference for option links by find the lowest command parent injector to determine the providers
     * dependency injection scope
     */
    resolveOptions(): void {
        const construtors = this.optionLinks
            .reduce((prev, cur) => [
                ...prev,
                ...(prev.indexOf(cur.constructorRef) === -1 ? [cur.constructorRef] : [])
            ], [] as Type<any>[]);

        construtors.forEach(constructorRef => {
            const links = this.optionLinks.filter(link => link.constructorRef === constructorRef);
            if (links.length === 1) {
                links[0].providerRef = new OptionsProviderRef(constructorRef, links[0].moduleRef, this.providers);
            } else {
                this.validateOptionsForSingleScope(links, constructorRef);
                const commonParents = links
                    .map((link) => [...link.moduleRef.parents, link.moduleRef])

                const maxLength = commonParents.reduce((prev, cur) => cur.length > prev ? cur.length : prev, 0);
                let i = 0;
                let found = false;
                for (i = maxLength - 1; i >= 0; i--) {
                    if (commonParents.filter(parents => parents[i] === commonParents[0][i]).length === commonParents.length) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    const providerRef = new OptionsProviderRef(constructorRef, commonParents[0][i], this.providers);
                    links.forEach(link => link.providerRef = providerRef);
                } else {
                    throw new CliBuildError(`Cannot find lowest common parent injector for the options containers ${constructorRef.name}`)
                }
            }
        });
    }

    /**
     * Ensures that two or more option links for the same container share a common dependency injection scope else it will throw an error
     * @param links Option links that have the same constructor reference
     * @param constructorRef Constructor of the option links
     */
    private validateOptionsForSingleScope(links: OptionsLink[], constructorRef: Type<any>) {
        const highest = links.map(link => [...link.moduleRef.parents, link.moduleRef][0]).reduce((prev, cur) => [
            ...prev,
            ...(prev.indexOf(cur) === -1 ? [cur] : [])
        ], []);
        if (highest.length > 1) {
            throw new CliBuildError(`Invalid Options Scope: The references to the options ${constructorRef.name} do not share a common parent injector as it exists in both the ${highest[0].constructorRef.name} and the ${highest[1].constructorRef.name} modules`);
        }
    }


}
