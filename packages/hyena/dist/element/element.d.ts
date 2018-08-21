import { TemplateResult } from "../renderer/core";
export declare abstract class HyenaElement extends HTMLElement {
    protected shadowable: boolean;
    constructor();
    abstract render(): TemplateResult;
    query<T extends Element>(selector: string): T;
    private triggerUpdatePipeline;
    private triggerRenderingPipeline;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: any, oldValue: any, newValue: any): void;
}
