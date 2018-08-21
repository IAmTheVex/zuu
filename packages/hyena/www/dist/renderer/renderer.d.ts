import { AttributePart, Part, SVGTemplateResult, TemplateInstance, TemplatePart, TemplateResult } from "./core";
export { render } from "./core";
export declare const html: (strings: TemplateStringsArray, ...values: any[]) => TemplateResult;
export declare const svg: (strings: TemplateStringsArray, ...values: any[]) => SVGTemplateResult;
export declare const partCallback: (instance: TemplateInstance, templatePart: TemplatePart, node: Node) => Part;
export declare class BooleanAttributePart extends AttributePart {
    setValue(values: any[], startIndex: number): void;
}
export declare class PropertyPart extends AttributePart {
    setValue(values: any[], startIndex: number): void;
}
export declare class EventPart implements Part {
    instance: TemplateInstance;
    element: Element;
    eventName: string;
    private _listener;
    constructor(instance: TemplateInstance, element: Element, eventName: string);
    setValue(value: any): void;
    handleEvent(event: Event): void;
}
