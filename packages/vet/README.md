<div align="center">
  <a href="http://zuu.thevexis.me/">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/big_title.png">
  </a>
</div>

# @zuu/vet

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?style=for-the-badge)](https://gitter.im/zuu-framework/)
[![Buy me a coffe](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/iamthevex) 
[![Version](https://img.shields.io/npm/v/@zuu/vet.svg)](https://npmjs.org/package/@zuu/vet)
[![Downloads/week](https://img.shields.io/npm/dw/@zuu/vet.svg)](https://npmjs.org/package/@zuu/vet)
[![License](https://img.shields.io/npm/l/@zuu/vet.svg)](https://github.com/IAmTheVex/zuu/blob/master/package.json)

## What is Vet?
Vet is a component of the Zuu framework designed to provide all the commons needed.

## Want to contribute?
Here's how!
<div align="center">
  <a href="https://github.com/IAmTheVex/zuu/blob/master/CONTRIBUTING.md">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/branching.png">
  </a>
</div>

## Quick intro
The vet in a zoo is like a... umm.... Whatever! Vet contains everything that all the other ~~ainmals~~ packages might need. This includes a global framework wide Event Bus with all the events handlers, custom events, customs local wide Event buses, configuration managers and configuration injectors, dependency injection, namespacing and scoping (ex: Singleton patterns already covered), debugging, debugger tags and log streams, async runtime management and long lasting tasks also, time tools, string formating tools, platform tools and other small tools.

## Runtime
You can run a scoped async task using:
```typescript
Runtime.scoped(null, async _ => {
    
});
```
`Runtime.scoped` runs an async task in a scope (in this case `null`) and it returns a `Promise` that resolves when the task returns.

## Events
The events system consists of a `EventBus`, the `AbstractEvent` and the `AbstractEventListener<T>`. There is also a global instance of `EventBus` used for framework wide event listening.

## Debugging
The Debugger connects to the Event Bus and emits `LogEvent`s and `ErrorEvent`s via the static methods that is provides `Debugger.log` and `Debugger.error`. Vet provides some default event listeners for the Debugger events that emmit the event to the `STDOUT` and `STDERR`. You can register those listeners using `Debugger.defaults` static method.

 It also provides log tags that act like template strings fromatters (check typescript docs for more ;)) to add metadata to your logs streams. For example the next snippet:
```typescript
Debugger.defaults();
let tag = Debugger.tag('tag-tag-tag');

let randomValue = 1298304;
Debugger.log(tag`Here's a random value: ${randomValue}!`);
```
produces the following output:
```
(tag-tag-tag): Here's a random value: 1298304!
```

## Dependency injection
Vet is onored to present to you, the world simplest Dependency Injection Container and tooling. No need to specify the providers (you can if you want...), no need to specify the scopes (you can if you want...), only specify where you want your dependency to be injected using the ```@Inject``` decorator and it will automagically lazy load (will be provided only when needed) your dependency. 

For example this script
```typescript
class NeededResource1 {
    private tag = Debugger.tag('needed-resource-1');

    public log() {
        Debugger.log(this.tag`Used!`);        
    }
};

class NeededResource2 {
    private tag = Debugger.tag('needed-resource-2');

    @Inject private resource: NeededResource1;

    public log() {
        this.resource.log();
        Debugger.log(this.tag`Used!`);        
    }
};

class User {
    @Inject private resource: NeededResource2;

    public demo() {
        this.resource.log();
    }
};

new User().demo();
```
produces the following output
```
(needed-resource-1): Used!
(needed-resource-2): Used!
```
As you can see it creates the resources even if they are nested!

Also you can scope resources! Vet comes out of the box with one scope: Singleton. You can use a scope like so:
```typescript
@Singleton
class NeededResource {
    private static count: number = 0;

    private tag = Debugger.tag('needed-resource');

    constructor() {
        Debugger.log(this.tag`Constructed! ${NeededResource.count}`);
        NeededResource.count ++;
    }

    public log() {
        Debugger.log(this.tag`Used!`);        
    }
};

class User {
    @Inject private resource1: NeededResource;
    @Inject private resource2: NeededResource;

    public demo() {
        this.resource1.log();
        this.resource2.log();
    }
};

new User().demo();
```
The sscript above produces the following output
```
(needed-resource): Constructed! 0
(needed-resource): Used!
(needed-resource): Used!
```

## Configuration
Vet's configuration is an subcase of the dependency injector. It finds, caches and auto reloads the configurations needed. The onfiguration files need to have a JSON format and the `.config.json` extension. They can be placed anywhere in the project structure! For example to load the config from `app.config.json` you can use:
```typescript
class X {
    @Configuration('app') private config: any;
}
```
If you want to autoreload the config when changes occur, you can pass `true` as the second parameter to the `@configuration` decorator.

Vet also provides a `ConfigurationManager` class used to extract, cache, invalidate, inflate and parse configurations. It can also extract the configuration values from the env using `@Configuration('$env')`.