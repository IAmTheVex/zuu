import { TemplateResult } from '../../renderer/core';
export interface Styleable {
    styling(): TemplateResult;
}
export declare function isStyleable(object: any): boolean;
