import { TemplateResult } from '../../renderer/core';
export interface Styleable {
    styling(): TemplateResult;
};

export function isStyleable(object: any): boolean {
    return typeof object.styling == 'function';
}