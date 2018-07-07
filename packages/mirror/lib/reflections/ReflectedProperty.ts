import { IReflectedObject } from "./IReflectedObject";
import { ReflectedType } from "./ReflectedType";

import { IDecoration } from "../decorator/IDecoration";
import { AbstractDecorator } from "../decorator/AbstractDecorator";

import { MirrorType } from "../type/MirrorType";

/**
 * Reflected property object
 */
export class ReflectedProperty implements IReflectedObject {
    /**
     * Reflected type
     */
    public type: ReflectedType;

    /**
     * Reflected name
     */
    public name: string;

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
     * Annotates the class with a decorator
     * (must provide the decoration also)
     * 
     * @param instance T: Instance of decorator
     * @param data IDecoration: The provided decoration
     */
    public annotate<T extends AbstractDecorator<any>>(instance: T, data: IDecoration) {
        if(instance.type != MirrorType.PROPERTY)
            throw new Error("Cannot annotate property without a PROPERTY Decorator!");
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
     * Returns all the annotations present on the property
     * 
     * @returns Map<namesapce: String, IDecoration>
     */
    public getAnnotations(): Map<string, IDecoration> {
        return this._annotations;
    }
}