import { Part, SVGTemplateResult, TemplateInstance, TemplatePart, TemplateResult } from "../core";
export { render } from "../core";
export { BooleanAttributePart, EventPart, PropertyPart } from "../renderer";
export declare const html: (strings: TemplateStringsArray, ...values: any[]) => TemplateResult;
export declare const svg: (strings: TemplateStringsArray, ...values: any[]) => SVGTemplateResult;
export declare const extendedPartCallback: (instance: TemplateInstance, templatePart: TemplatePart, node: Node) => Part;
