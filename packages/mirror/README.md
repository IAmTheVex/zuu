<div align="center">
  <a href="http://zuu.thevexis.me/">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/big_title.png">
  </a>
</div>

# @zuu/mirror

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?style=for-the-badge)](https://gitter.im/zuu-framework/)
[![Buy me a coffe](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/iamthevex) 
[![Version](https://img.shields.io/npm/v/@zuu/mirror.svg)](https://npmjs.org/package/@zuu/mirror)
[![Downloads/week](https://img.shields.io/npm/dw/@zuu/mirror.svg)](https://npmjs.org/package/@zuu/mirror)
[![License](https://img.shields.io/npm/l/@zuu/mirror.svg)](https://github.com/IAmTheVex/zuu/blob/master/package.json)

## What is Mirror?
Mirror is a very powerfull reflection api created for typescript, mainly used with the zuu framework (for dependency injection, assertion and other cool stuff).

## Want to contribute?
Here's how!
<div align="center">
  <a href="https://github.com/IAmTheVex/zuu/blob/master/CONTRIBUTING.md">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/branching.png">
  </a>
</div>

## Usage
The basic principle is easy. Decorations are attached to ```classes, properties, methods and method parameters``` and can be reflected after by a very powerfull reflection engine (that also provides aditional information about the types, names, positions, etc).

The first step is to create a new decoration:
```typescript
// just extend the IDecoration interface
interface GParameters extends IDecoration {
    x: number;
    y?: string;
};
```
After that we can define our decorator logic:
```typescript
// just extend the AbstractDecorator<T> and provide a IDecoration type
class GDecorator extends AbstractDecorator<GParameters> {
    constructor() {
        // provide information about the MirrorType [CLASS, PROPERTY, METHOD, PARAMETER] and a namespace (must be unique)
        super(MirrorType.CLASS, "demos.class.g");
    };

    public annotate(instance: GParameters, target: any, key?: string | symbol, index?: number) {
        // here you can process your decoration placement
        console.log(instance);
    };
};
```
Now we can ask mirror to build our decorator: (don't forget to say please)
```typescript
// Hey Mirror, sorry for bothering you, but can you please make a new decorator?
//  It will be a ClassDecorator and will bind to GParameters decoration :) Thanks
let G = Mirror.decorator<GParameters, ClassDecorator>(new GDecorator);
```
That's all :) Now you can use it on any class like so:
```typescript
@G({x: 3, y: "abcd"})
class Dummy { };
```
It's a decorator factory actually... but you can convert it to a decorator just by calling it with the decoration:
```typescript
let g = G({x: 0});

@g
class Dummy2 {};
```
You can now reflect on your class or class instances (also on specific methods and properties):
```typescript
let reflection: ReflectedClass = Mirror.reflect<ReflectedClass>(Dummy);
console.log(reflection);

let instance = new Dummy2()
let instanceReflection: ReflectedClass = Mirror.reflectInstance<ReflectedClass>(instance);
console.log(instanceReflection);
```

## Objects
| Object | Reflection | Decorator |
|:------ |:----------:| ---------:|
| type | `ReflectedType` | `-` |
| class | `ReflectedClass` | `ClassDecorator` |
| property | `ReflectedProperty` | `PropertyDecorator` |
| method | `ReflectedMethod` | `MethodDecorator` |
| parameter | `ReflectedParameter` | `ParamterDecorator` |