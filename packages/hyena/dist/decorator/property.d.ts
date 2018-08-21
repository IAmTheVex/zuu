import { IDecoration, AbstractDecorator } from '@zuu/mirror';
export interface PropertyParameters extends IDecoration {
    type?: String;
    watch?: boolean;
}
export declare class PropertyBindDecorator extends AbstractDecorator<PropertyParameters> {
    constructor();
    annotate(instance: PropertyParameters, target: any, key?: string): PropertyDescriptor;
}
export declare const Property: (watch?: boolean, type?: "Int" | "Float" | "JSON" | "String") => PropertyDecorator;
