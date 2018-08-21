export interface OnWillRender {
    onWillRender(): void;
};

export function isOnWillRenderValid(object: any): boolean {
    return typeof object.onWillRender == 'function';
}