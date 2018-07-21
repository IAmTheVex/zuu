<div align="center">
  <a href="http://zuu.thevexis.me/">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/big_title.png">
  </a>
</div>


[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?style=for-the-badge)](https://gitter.im/zuu-framework/)

Zuu is a web framework for the backend! Written in TypeScript and running on the NodeJS platform, it inspires beautiful and declarative code! Check out [the website](http://zuu.thevexis.me) for more info!

It aims at providing the developer with all the tools needed to make a very powerful app using mainly declarative code. Just tell the framework what to do and when... don't worry about how it's done. It's mainly oriented on the API pattern but it can also do MVC.

It's based arround a powerful reflection API (@zuu/mirror) written to acomodate the new Metadata API is ESNext and the Decorators that TypeScript provides early access to!

The core components of Zuu are:
1) Mirror: Powerful reflection API for typescript
2) Vet: Comon components (DI, Configuration, Runtime management, Event bus and more)
3) Mink: Routing and serving
4) Ferret: ORM (fork of typeorm)
5) Owl: Nightly juicy add-on for Mink that provides GraphQL bindings

You can check each package in the `packages` directory for more information about each one. You can also check out the `demos` directory for some examples.

## Quick start
To install:
```shell
$ npm install --global @zuu/cli
```

To create a new project:
```shell
$ zuu new simple my-project
$ cd my-project
$ npm install
```

To run the project:
```shell
$ npm run compile
$ npm start
```

## Want to contribute?
Here's how!
<div align="center">
  <a href="https://github.com/IAmTheVex/zuu/blob/master/CONTRIBUTING.md">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/branching.png">
  </a>
</div>