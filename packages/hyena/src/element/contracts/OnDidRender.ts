export interface OnDidRender {
    onDidRender(): void;
};

export function isOnDidRenderValid(object: any): boolean {
    return typeof object.onDidRender == 'function';
}