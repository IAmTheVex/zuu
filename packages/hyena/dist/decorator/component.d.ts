import { AbstractDecorator, IDecoration } from "@zuu/mirror";
import { Class } from './util';
export interface ComponentParameters extends IDecoration {
    tag: string;
}
export declare class ComponentDecorator extends AbstractDecorator<ComponentParameters> {
    constructor();
    annotate(instance: ComponentParameters, target: Class<any>): Class<any>;
}
export declare const Component: (obj: ComponentParameters) => ClassDecorator;
