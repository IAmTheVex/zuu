<div align="center">
  <a href="http://zuu.thevexis.me/">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/big_title.png">
  </a>
</div>

# @zuu/bootstrap


[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?style=for-the-badge)](https://gitter.im/zuu-framework/)
[![Version](https://img.shields.io/npm/v/@zuu/bootstrap.svg)](https://npmjs.org/package/@zuu/bootstrap)
[![Downloads/week](https://img.shields.io/npm/dw/@zuu/bootstrap.svg)](https://npmjs.org/package/@zuu/bootstrap)
[![License](https://img.shields.io/npm/l/@zuu/bootstrap.svg)](https://github.com/IAmTheVex/zuu/blob/master/package.json)

## What is Bootstrap?
Good question.. Bootstrap is a component of the Zuu framework that combines every other's component configuration object into a single object, making it easy to start with the framework. It also adds custom event listeners for Mink, Owl, Ferret and more! It also ties rogether all the DI containers into a single one, provided by Vet and made globaly available in the entire app.

## Want to contribute?
Here's how!
<div align="center">
  <a href="https://github.com/IAmTheVex/zuu/blob/master/CONTRIBUTING.md">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/branching.png">
  </a>
</div>

## The configuration object?
There you go! :) Pretty self explanatory
```typescript
export interface ZuuOptions extends MinkOptions {
    model?: ConnectionOptions,
    server?: {
        port?: number,
        modules?: AbstractModule[]
    },
    graph?: GQLOptions,
    resolvers?: Function[],
    listeners?: AbstractEventListener<any>[]
}
```

You can register listeners, configure Ferret and Mink, also Owl and youcan add server modules into the mix!

## What does it provide?
A simple class `Bootstrap` that has a static method `scope(config)` that returns a `BootstrapedConfiguration` that can be run in an asyn runtime to return an Express (by default) instance.
```typescript
let timer = new Timer().reset();
Runtime.scoped(null, async _ => {
    Debugger.log(tag`Initialization began!`);
    let { app } = await Bootstrap.scope(options).run();
    return (typeof app != "undefined" && app != null);
})
.then(async result => {
    Debugger.log(tag`Initialization succeeded! Took ${timer.stop().diff()}ms!`);
})
.catch(Debugger.error);
```

## Server modules
Server modules are pieces of code that interact with the low-level Express/Koa/Hapi without the preinstalled driver! That means you can do really low-level stuff like... Let's say change the rendering engine to Handlebars if you wish (i actually prefer it over Jade or Pug or Blade).
```typescript
export class ExpressHandlebarsRenderer extends AbstractModule implements IBeforeHnadler {
    public constructor(private options: ExphbsOptions = {}) {
        super([LoadType.BEFORE]);
    }

    public handleBefore(app: Application): Application {
        let exhdbs: Exphbs = hdbs.create(this.options);
        app.engine("handlebars", exhdbs.engine);
        app.set("view engine", "handlebars");
        Debugger.log(tag`Module loaded!`);
        return app;
    }
};
```