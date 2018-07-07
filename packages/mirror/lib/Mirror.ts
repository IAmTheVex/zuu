import "reflect-metadata";

import { IReflectedObject } from "./reflections/IReflectedObject";
import { ReflectedType } from "./reflections/ReflectedType";
import { ReflectedProperty } from "./reflections/ReflectedProperty";
import { ReflectedParameter } from "./reflections/ReflectedParameter";
import { ReflectedMethod } from "./reflections/ReflectedMethod";
import { ReflectedClass } from "./reflections/ReflectedClass";

import { IDecoration } from "./decorator/IDecoration";
import { AbstractDecorator } from "./decorator/AbstractDecorator";

import { MirrorType } from "./type/MirrorType";

export class Mirror {
    private static PRIMITIVE_TYPES = ["String", "Number", "Function", "Object", "Array"];

    private static REFLECTION_KEY: string = "mirror:reflection";

    private static isCircularReference(target: Function, subject: Function): boolean {
        return target.name == subject.name;
    }

    private static getParameterNames(f: Function): string[] {
        return (f + '')
            .replace(/[/][/].*$/mg,'')
            .replace(/\s+/g, '')
            .replace(/[/][*][^/*]*[*][/]/g, '')
            .split('){', 1)[0].replace(/^[^(]*[(]/, '')
            .replace(/=[^,]+/g, '')
            .split(',').filter(Boolean);
    }
    
    private static isPrimitive(subject: Function): boolean {
        return this.PRIMITIVE_TYPES.includes(subject.name); 
    }

    /**
     * Extracts the reflection of any object type
     * (given that the object contains reflected data)
     * (reflection only occurs when metadata is available, for the moment, when decorators are applied)
     * 
     * @param object Function: describes the constructor of any object
     * @param key? string: describes the optional key insetting of the reflection
     * @returns T extends IReflectedObject: the result of introspection
     */
    public static reflect<T extends IReflectedObject>(object: Function, key?: string): T {
        let reflection: T;
        if(key) reflection = <T> Reflect.getMetadata(this.REFLECTION_KEY, object, key);
        else reflection = <T> Reflect.getMetadata(this.REFLECTION_KEY, object);

        return reflection;
    }

    /**
     * Extracts the reflection of any object instance
     * (given that the object contains reflected data)
     * (reflection only occurs when metadata is available, for the moment, when decorators are applied)
     * 
     * @param object Function: describes the instance of any object
     * @param key? string: describes the optional key insetting of the reflection
     * @returns T extends IReflectedObject: the result of introspection
     */
    public static reflectInstance<T extends IReflectedObject>(object: Object, key?: string): T {
        return this.reflect(object.constructor, key);
    }

    /**
     * Safely instantiates an object given it's type
     * 
     * @param tConstructor TypeConstructor: the container type of any constructor
     * @param args any[]: the arguments that are going to be passed to the constructor
     * @returns T: the result of instantiation of tConstructor
     */
    public static instantiate<T>(tConstructor: { new(...args: any[]): T }, ...args: any[]): T {
        return new tConstructor(...args);
    }

    /**
     * Builds an decorator factory of type E accepting T decorations
     * 
     * @param d AbstractDecorator<T>: decorator cast
     * @returns DecoratorFactory (obj: T) => E
     */
    public static decorator<T extends IDecoration, E>(d: AbstractDecorator<T>): (obj: T) => E {
        return (obj: T) => {
            if(d.type == MirrorType.CLASS) {
                return <E>(<any>((target: Function) => {
                    let reflection = ReflectedClass.initialize(target, this.REFLECTION_KEY);
                    reflection.annotate<AbstractDecorator<T>>(d, obj);
                    Reflect.defineMetadata(this.REFLECTION_KEY, reflection, target);
                    return d.annotate(obj, target);
                }));
            } else if(d.type == MirrorType.PROPERTY) {
                return <E>(<any>((target: Object, key: string) => {
                    let clazz = ReflectedClass.initialize(target.constructor, this.REFLECTION_KEY);
                    let property = clazz.property(key);
                    let _internalType: any = Reflect.getMetadata("design:type", target, key);
                    let type = new ReflectedType(_internalType, _internalType.name, this.isCircularReference(target.constructor, _internalType), this.isPrimitive(target.constructor));
                    property.setup(type, key);
                    property.annotate<AbstractDecorator<T>>(d, obj);
                    Reflect.defineMetadata(this.REFLECTION_KEY, property, target.constructor, key);
                    Reflect.defineMetadata(this.REFLECTION_KEY, clazz, target.constructor);
                    return d.annotate(obj, target, key);
                }));
            } else if(d.type == MirrorType.METHOD) {
                return <E>(<any>((target: Object, key: string) => {
                    let clazz = ReflectedClass.initialize(target.constructor, this.REFLECTION_KEY);
                    let method = clazz.method(key);
                    let r: Function = Reflect.getMetadata("design:returntype", target, key);
                    let _return = new ReflectedType(r ? r : null, r ? r.name : null, r ? this.isCircularReference(target.constructor, r) : false, r ? this.isPrimitive(r) : true);
                    method.setup(_return, key);
                    let parameterNames = this.getParameterNames(target[key]);
                    let parameterTypes: Function[] = Reflect.getMetadata("design:paramtypes", target, key);
                    for(let index = 0; index < parameterNames.length; index++) {
                        let parameter = method.parameter(index);
                        let type = new ReflectedType(parameterTypes[index], parameterTypes[index].name, this.isCircularReference(target.constructor, parameterTypes[index]), this.isPrimitive(parameterTypes[index]));
                        parameter.setup(type, parameterNames[index], index);
                    }
                    method.annotate<AbstractDecorator<T>>(d, obj);
                    Reflect.defineMetadata(this.REFLECTION_KEY, method, target.constructor, key);
                    Reflect.defineMetadata(this.REFLECTION_KEY, clazz, target.constructor);
                    return d.annotate(obj, target, key);
                }));
            } else if(d.type == MirrorType.PARAMETER) {
                return <E>(<any>((target: Object, key: string, parameterIndex: number) => {
                    let clazz = ReflectedClass.initialize(target.constructor, this.REFLECTION_KEY);
                    let method = clazz.method(key);
                    let r: Function = Reflect.getMetadata("design:returntype", target, key);
                    let _return = new ReflectedType(r ? r : null, r ? r.name : null, r ? this.isCircularReference(target.constructor, r) : false, r ? this.isPrimitive(r) : true);
                    method.setup(_return, key);
                    let parameterNames = this.getParameterNames(target[key]);
                    let parameterTypes: Function[] = Reflect.getMetadata("design:paramtypes", target, key);
                    for(let index = 0; index < parameterNames.length; index++) {
                        let parameter = method.parameter(index);
                        let type = new ReflectedType(parameterTypes[index], parameterTypes[index].name, this.isCircularReference(target.constructor, parameterTypes[index]), this.isPrimitive(parameterTypes[index]));
                        parameter.setup(type, parameterNames[index], index);
                        if(index == parameterIndex) {
                            parameter.annotate<AbstractDecorator<T>>(d, obj);
                            Reflect.defineMetadata(this.REFLECTION_KEY, method, target.constructor, key);
                            Reflect.defineMetadata(this.REFLECTION_KEY, clazz, target.constructor);
                            d.annotate(obj, target, key, index);
                        }
                    }
                }));
            }
        };
    }
}