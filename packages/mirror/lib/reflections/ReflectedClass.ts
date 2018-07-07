import "reflect-metadata";

import { IReflectedObject } from "./IReflectedObject";
import { ReflectedType } from "./ReflectedType";
import { ReflectedProperty } from "./ReflectedProperty";
import { ReflectedParameter } from "./ReflectedParameter";
import { ReflectedMethod } from "./ReflectedMethod";

import { IDecoration } from "../decorator/IDecoration";
import { AbstractDecorator } from "../decorator/AbstractDecorator";

import { MirrorType } from "../type/MirrorType";

/**
 * Reflected class object
 */
export class ReflectedClass implements IReflectedObject {
    /**
     * Reflected type
     */
    public type: ReflectedType;
    
    /**
     * Reflected name
     */
    public name: string;
    
    /**
     * Reflected properties
     */
    public properties: { [key: string]: ReflectedProperty} = {};
    
    /**
     * Reflected methods
     */
    public methods: { [key: string]: ReflectedMethod} = {};

    private _annotations: Map<string, IDecoration> = new Map();

    /**
     * Used to provide info to the already created object
     * 
     * @param type ReflectedType: Internal reflected type
     * @param name string: Reflected name
     */
    public setup(type: ReflectedType, name: string) {
        this.type = type;
        this.name = name;
    }

    /**
     * Creates or returns a property
     * 
     * @param name String: the name of the property
     * @returns ReflectedProperty
     */
    public property(name: string): ReflectedProperty {
        if(!this.properties[name]) this.properties[name] = new ReflectedProperty();
        return this.properties[name];
    }

    /**
     * Creates or returns a method
     * 
     * @param name String: the name of the method
     * @returns ReflectedMethod
     */
    public method(name: string): ReflectedMethod {
        if(!this.methods[name]) this.methods[name] = new ReflectedMethod();
        return this.methods[name];
    }

    /**
     * Annotates the class with a decorator
     * (must provide the decoration also)
     * 
     * @param instance T: Instance of decorator
     * @param data IDecoration: The provided decoration
     */
    public annotate<T extends AbstractDecorator<any>>(instance: T, data: IDecoration) {
        if(instance.type != MirrorType.CLASS)
            throw new Error("Cannot annotate class without a CLASS Decorator!");
        this._annotations.set(instance.namespace, data);
    }

    /**
     * Checks if a decorator has been annotated or not
     * 
     * @param instance T: instance of decorator
     * @returns boolean: is the decorator present or not
     */
    public isAnnotationPresent<T extends AbstractDecorator<any>>(instance: T): boolean {
        return this._annotations.has(instance.namespace);
    }

    /**
     * Get the data of the T decorator
     * (precasted to G)
     * 
     * @param instance T: instance of decorator
     * @returns G: the IDecoration precasted
     */
    public getAnnotationData<G extends IDecoration, T extends AbstractDecorator<G>>(instance: T): G {
        return <G>this._annotations.get(instance.namespace);
    }

    /**
     * Returns all the annotations present on the class
     * 
     * @returns Map<namesapce: String, IDecoration>
     */
    public getAnnotations(): Map<string, IDecoration> {
        return this._annotations;
    }

    /**
     * Initializes reflection processes in the reflection memeory
     * 
     * @param target Function: class constructor
     * @param area string: place in reflection memory to save the reflected object in
     * @returns ReflectedClass: the initializated reflected object for the target
     */
    public static initialize(target: Function, area: string): ReflectedClass {
        let reflection: ReflectedClass = Reflect.getMetadata(area, target);
        if(!reflection) {
            reflection = new ReflectedClass();
            let type = new ReflectedType(target, target.name, true, false);
            reflection.setup(type, target.name);    
        }
        return reflection;    
    }
}
