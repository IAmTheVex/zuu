import { IReflectedObject } from "./IReflectedObject";
import { ReflectedType } from "./ReflectedType";

import { IDecoration } from "../decorator/IDecoration";
import { AbstractDecorator } from "../decorator/AbstractDecorator";

import { MirrorType } from "../type/MirrorType";

/**
 * Reflected type object
 */
export class ReflectedParameter implements IReflectedObject {
    /**
     * Reflected type
     */
    public type: ReflectedType;
    
    /**
     * Reflected name
     */
    public name: string;
    
    /**
     * Reflected index
     */
    public index: number;

    private _annotations: Map<string, IDecoration> = new Map();

    /**
     * Used to provide info to the already created object
     * 
     * @param type ReflectedType: the type of the parameter
     * @param name string: the name of the parameter
     * @param index number: the index of the parameter in the arguments list
     */
    public setup(type: ReflectedType, name: string, index: number) {
        this.type = type;
        this.name = name;
        this.index = index;
    }

    /**
     * Annotates the class with a decorator
     * (must provide the decoration also)
     * 
     * @param instance T: Instance of decorator
     * @param data IDecoration: The provided decoration
     */
    public annotate<T extends AbstractDecorator<any>>(instance: T, data: IDecoration) {
        if(instance.type != MirrorType.PARAMETER)
            throw new Error("Cannot annotate parameter without a PARAMETER Decorator!");
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
     * Returns all the annotations present on the parameter
     * 
     * @returns Map<namesapce: String, IDecoration>
     */
    public getAnnotations(): Map<string, IDecoration> {
        return this._annotations;
    }
}
