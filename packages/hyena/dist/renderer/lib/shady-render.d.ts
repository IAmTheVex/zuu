import { TemplateResult } from "../core";
export { html, svg, TemplateResult } from "../core";
declare global {
    interface Window {
        ShadyCSS: any;
    }
    class ShadowRoot {
    }
}
export declare function render(result: TemplateResult, container: Element | DocumentFragment, scopeName: string): void;
