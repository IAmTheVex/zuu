export declare const templateCaches: Map<string, Map<TemplateStringsArray, Template>>;
export declare const html: (strings: TemplateStringsArray, ...values: any[]) => TemplateResult;
export declare const svg: (strings: TemplateStringsArray, ...values: any[]) => SVGTemplateResult;
export declare class TemplateResult {
    strings: TemplateStringsArray;
    values: any[];
    type: string;
    partCallback: PartCallback;
    constructor(strings: TemplateStringsArray, values: any[], type: string, partCallback?: PartCallback);
    getHTML(): string;
    getTemplateElement(): HTMLTemplateElement;
}
export declare class SVGTemplateResult extends TemplateResult {
    getHTML(): string;
    getTemplateElement(): HTMLTemplateElement;
}
export declare type TemplateFactory = (result: TemplateResult) => Template;
export declare function defaultTemplateFactory(result: TemplateResult): Template;
export declare type TemplateContainer = (Element | DocumentFragment) & {
    __templateInstance?: TemplateInstance;
};
export declare function render(result: TemplateResult, container: Element | DocumentFragment, templateFactory?: TemplateFactory): void;
export declare class TemplatePart {
    type: string;
    index: number;
    name?: string;
    strings?: string[];
    constructor(type: string, index: number, name?: string, strings?: string[]);
    readonly rawName: string | undefined;
}
export declare const isTemplatePartActive: (part: TemplatePart) => boolean;
export declare class Template {
    parts: TemplatePart[];
    element: HTMLTemplateElement;
    constructor(result: TemplateResult, element: HTMLTemplateElement);
}
export declare const getValue: (part: Part, value: any) => any;
export interface DirectiveFn<P = Part> {
    (part: P): void;
    __litDirective?: true;
}
export declare const directive: <P = Part>(f: DirectiveFn<P>) => DirectiveFn<P>;
export declare const noChange: {};
export { noChange as directiveValue };
export declare const _isPrimitiveValue: (value: any) => boolean;
export interface Part {
    instance: TemplateInstance;
    size?: number;
}
export interface SinglePart extends Part {
    setValue(value: any): void;
}
export interface MultiPart extends Part {
    setValue(values: any[], startIndex: number): void;
}
export declare class AttributePart implements MultiPart {
    instance: TemplateInstance;
    element: Element;
    name: string;
    strings: string[];
    size: number;
    _previousValues: any;
    constructor(instance: TemplateInstance, element: Element, name: string, strings: string[]);
    protected _interpolate(values: any[], startIndex: number): string;
    protected _equalToPreviousValues(values: any[], startIndex: number): boolean;
    setValue(values: any[], startIndex: number): void;
}
export declare class NodePart implements SinglePart {
    instance: TemplateInstance;
    startNode: Node;
    endNode: Node;
    _previousValue: any;
    constructor(instance: TemplateInstance, startNode: Node, endNode: Node);
    setValue(value: any): void;
    private _insert;
    private _setNode;
    private _setText;
    private _setTemplateResult;
    private _setIterable;
    private _setPromise;
    clear(startNode?: Node): void;
}
export declare type PartCallback = (instance: TemplateInstance, templatePart: TemplatePart, node: Node) => Part;
export declare const defaultPartCallback: (instance: TemplateInstance, templatePart: TemplatePart, node: Node) => Part;
export declare class TemplateInstance {
    _parts: Array<Part | undefined>;
    _partCallback: PartCallback;
    _getTemplate: TemplateFactory;
    template: Template;
    constructor(template: Template, partCallback: PartCallback, getTemplate: TemplateFactory);
    update(values: any[]): void;
    _clone(): DocumentFragment;
}
export declare const reparentNodes: (container: Node, start: Node, end?: Node, before?: Node) => void;
export declare const removeNodes: (container: Node, startNode: Node, endNode?: Node) => void;
