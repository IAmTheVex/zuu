import { IReflectedObject } from "./IReflectedObject";
import { ReflectedType } from "./ReflectedType";
import { ReflectedParameter } from "./ReflectedParameter";

import { IDecoration } from "../decorator/IDecoration";
import { AbstractDecorator } from "../decorator/AbstractDecorator";

import { MirrorType } from "../type/MirrorType";

/**
 * Reflected method object
 */
export class ReflectedMethod implements IReflectedObject {
    /**
     * Reflected return type
     */
    public return: ReflectedType;
   
    /**
     * Reflected type
     */
    public name: string;
    
    /**
     * Reflected parameters
     */
    public parameters: ReflectedParameter[] = [];

    private _annotations: Map<string, IDecoration> = new Map();

    /**
     * Used to provide info to the already created object
     * 
     * @param _return ReflectedType: Return type of the method
     * @param name string: Reflected method name
     */
    public setup(_return: ReflectedType, name: string) {
        this.return = _return;
        this.name = name;
    }

    /**
     * Creates or returns a parameter
     * 
     * @param index number: the parameter index
     * @returns ReflectedParameter
     */
    public parameter(index: number): ReflectedParameter {
        if(!this.parameters[index]) this.parameters[index] = new ReflectedParameter();
        return this.parameters[index];
    }

    /**
     * Annotates the method with a decorator
     * (must provide the decoration also)
     * 
     * @param instance T: Instance of decorator
     * @param data IDecoration: The provided decoration
     */
    public annotate<T extends AbstractDecorator<any>>(instance: T, data: IDecoration) {
        if(instance.type != MirrorType.METHOD)
            throw new Error("Cannot annotate method without a METHOD Decorator!");
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
     * Returns all the annotations present on the method
     * 
     * @returns Map<namesapce: String, IDecoration>
     */
    public getAnnotations(): Map<string, IDecoration> {
        return this._annotations;
    }
}
