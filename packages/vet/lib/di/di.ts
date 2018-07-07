'use strict';
import 'reflect-metadata';

export function Singleton(target: Function) {
    DiContainer.bind(target).scope(Scope.Singleton);
}

export function Scoped(scope: Scope) {
    return function(target: Function) {
        DiContainer.bind(target).scope(scope);
    };
}

export function Provided(provider: Provider) {
    return function(target: Function) {
        DiContainer.bind(target).provider(provider);
    };
}

export function Provides(target: Function) {
    return function(to: Function) {
        DiContainer.bind(target).to(to);
    };
}

export function AutoWired(target: Function) { // <T extends {new(...args:any[]):{}}>(target:T) {
    const newConstructor = InjectorHanlder.decorateConstructor(target);
    const config: ConfigImpl = <ConfigImpl>DiContainer.bind(target);
    config.toConstructor(newConstructor);
    return newConstructor;
}

export function Inject(...args: any[]) {
    if (args.length < 3 || typeof args[2] === 'undefined') {
        return InjectPropertyDecorator.apply(this, args);
    } else if (args.length === 3 && typeof args[2] === 'number') {
        return InjectParamDecorator.apply(this, args);
    }

    throw new Error('Invalid @Inject Decorator declaration.');
}

function InjectPropertyDecorator(target: Function, key: string) {
    let t = Reflect.getMetadata('design:type', target, key);
    if (!t) {
        // Needed to support react native inheritance
        t = Reflect.getMetadata('design:type', target.constructor, key);
    }
    DiContainer.injectProperty(target.constructor, key, t);
}

function InjectParamDecorator(target: Function, propertyKey: string | symbol, parameterIndex: number) {
    if (!propertyKey) { // only intercept constructor parameters
        const config: ConfigImpl = <ConfigImpl>DiContainer.bind(target);
        config.paramTypes = config.paramTypes || [];
        const paramTypes: Array<any> = Reflect.getMetadata('design:paramtypes', target);
        config.paramTypes.unshift(paramTypes[parameterIndex]);
    }
}

export class Container {
    private static snapshots: {providers: Map<Function, Provider>; scopes: Map<Function, Scope>} = {
        providers: new Map(),
        scopes: new Map(),
    };

    static bind(source: Function): Config {
        if (!DiContainer.isBound(source)) {
            AutoWired(source);
            return DiContainer.bind(source).to(source);
        }

        return DiContainer.bind(source);
    }

    static get(source: Function) {
        return DiContainer.get(source);
    }

    static getType(source: Function) {
        return DiContainer.getType(source);
    }

    static snapshot(source: Function): void {
        const config = <ConfigImpl>Container.bind(source);
        Container.snapshots.providers.set(source, config.diprovider);
        if(config.discope) {
            Container.snapshots.scopes.set(source, config.discope);
        }
        return;
    }

    static restore(source: Function): void {
        if(!(Container.snapshots.providers.has(source))) {
            throw new TypeError('Config for source was never snapshoted.');
        }
        const config = Container.bind(source);
        config.provider(Container.snapshots.providers.get(source));
        if(Container.snapshots.scopes.has(source)) {
            config.scope(Container.snapshots.scopes.get(source));
        }
    }
}

class DiContainer {
    private static bindings: Map<FunctionConstructor, ConfigImpl> = new Map<FunctionConstructor, ConfigImpl>();

    static isBound(source: Function): boolean {
        checkType(source);
        const baseSource = InjectorHanlder.getConstructorFromType(source);
        const config: ConfigImpl = DiContainer.bindings.get(baseSource);
        return (!!config);
    }

    static bind(source: Function): Config {
        checkType(source);
        const baseSource = InjectorHanlder.getConstructorFromType(source);
        let config: ConfigImpl = DiContainer.bindings.get(baseSource);
        if (!config) {
            config = new ConfigImpl(baseSource);
            DiContainer.bindings.set(baseSource, config);
        }
        return config;
    }

    static get(source: Function) {
        const config: ConfigImpl = <ConfigImpl>DiContainer.bind(source);
        if (!config.diprovider) {
            config.to(<FunctionConstructor>config.source);
        }
        return config.getInstance();
    }

    static getType(source: Function): Function {
        checkType(source);
        const baseSource = InjectorHanlder.getConstructorFromType(source);
        const config: ConfigImpl = DiContainer.bindings.get(baseSource);
        if (!config) {
            throw new TypeError(`The type ${source.name} hasn't been registered with the DI Container`);
        }
        return config.targetSource || config.source;
    }

    static injectProperty(target: Function, key: string, propertyType: Function) {
        const propKey = `__${key}`;
        Object.defineProperty(target.prototype, key, {
            enumerable: true,
            get: function() {
                return this[propKey] ? this[propKey] : this[propKey] = DiContainer.get(propertyType);
            },
            set: function(newValue) {
                this[propKey] = newValue;
            }
        });
    }

    static assertInstantiable(target: any) {
        if (target['__block_Instantiation']) {
            throw new TypeError('Can not instantiate Singleton class. ' +
                'Ask Container for it, using Container.get');
        }
    }
}

function checkType(source: Object) {
    if (!source) {
        throw new TypeError('Invalid type requested to Di ' +
            'container. Type is not defined.');
    }
}

export interface Config {
    to(target: Object): Config;
    provider(provider: Provider): Config;
    scope(scope: Scope): Config;
    withParams(...paramTypes: any[]): Config;
}

class ConfigImpl implements Config {
    source: Function;
    targetSource: Function;
    diprovider: Provider;
    discope: Scope;
    decoratedConstructor: FunctionConstructor;
    paramTypes: Array<any>;

    constructor(source: Function) {
        this.source = source;
    }

    to(target: FunctionConstructor) {
        checkType(target);
        const targetSource = InjectorHanlder.getConstructorFromType(target);
        this.targetSource = targetSource;
        if (this.source === targetSource) {
            const configImpl = this;
            this.diprovider = {
                get: () => {
                    const params = configImpl.getParameters();
                    if (configImpl.decoratedConstructor) {
                        return (params ? new configImpl.decoratedConstructor(...params) : new configImpl.decoratedConstructor());
                    }
                    return (params ? new target(...params) : new target());
                }
            };
        } else {
            this.diprovider = {
                get: () => {
                    return DiContainer.get(target);
                }
            };
        }
        if (this.discope) {
            this.discope.reset(this.source);
        }
        return this;
    }

    provider(provider: Provider) {
        this.diprovider = provider;
        if (this.discope) {
            this.discope.reset(this.source);
        }
        return this;
    }

    scope(scope: Scope) {
        this.discope = scope;
        if (scope === Scope.Singleton) {
            (<any>this).source['__block_Instantiation'] = true;
            scope.reset(this.source);
        } else if ((<any>this).source['__block_Instantiation']) {
            delete (<any>this).source['__block_Instantiation'];
        }
        return this;
    }

    withParams(...paramTypes: any[]) {
        this.paramTypes = paramTypes;
        return this;
    }

    toConstructor(newConstructor: FunctionConstructor) {
        this.decoratedConstructor = newConstructor;
        return this;
    }

    getInstance() {
        if (!this.discope) {
            this.scope(Scope.Local);
        }
        return this.discope.resolve(this.diprovider, this.source);
    }

    private getParameters() {
        if (this.paramTypes) {
            return this.paramTypes.map(paramType => DiContainer.get(paramType));
        }
        return null;
    }
}

export interface Provider {
    get(): Object;
}

export abstract class Scope {
    static Local: Scope;
    static Singleton: Scope;
    abstract resolve(provider: Provider, source: Function): any;

    reset(source: Function) {
    }
}

class LocalScope extends Scope {
    resolve(provider: Provider, source: Function) {
        return provider.get();
    }
}

Scope.Local = new LocalScope();

class SingletonScope extends Scope {
    private static instances: Map<Function, any> = new Map<Function, any>();

    resolve(provider: Provider, source: any) {
        let instance: any = SingletonScope.instances.get(source);
        if (!instance) {
            source['__block_Instantiation'] = false;
            instance = provider.get();
            source['__block_Instantiation'] = true;
            SingletonScope.instances.set(source, instance);
        }
        return instance;
    }

    reset(source: Function) {
        SingletonScope.instances.delete(InjectorHanlder.getConstructorFromType(source));
    }
}

Scope.Singleton = new SingletonScope();

class InjectorHanlder {
    static constructorNameRegEx = /function (\w*)/;

    static decorateConstructor(target: Function) {
        let newConstructor: any;
        // tslint:disable-next-line:class-name
        newConstructor = class di_wrapper extends (<FunctionConstructor>target) {
            constructor(...args: any[]) {
                super(...args);
                DiContainer.assertInstantiable(target);
            }
        };
        newConstructor['__parent'] = target;
        return newConstructor;
    }

    static hasNamedConstructor(source: Function): boolean {
        if (source['name']) {
            return source['name'] !== 'di_wrapper';
        } else {
            try {
                const constructorName = source.prototype.constructor.toString().match(this.constructorNameRegEx)[1];
                return (constructorName && constructorName !== 'di_wrapper');
            } catch {
                // make linter happy
            }

            return false;
        }
    }

    static getConstructorFromType(target: Function): FunctionConstructor {
        let typeConstructor: any = target;
        if (this.hasNamedConstructor(typeConstructor)) {
            return <FunctionConstructor>typeConstructor;
        }
        while (typeConstructor = typeConstructor['__parent']) {
            if (this.hasNamedConstructor(typeConstructor)) {
                return <FunctionConstructor>typeConstructor;
            }
        }
        throw TypeError('Can not identify the base Type for requested target');
    }
}