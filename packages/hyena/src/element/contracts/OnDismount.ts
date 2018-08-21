export interface OnDismount {
    onDismount(): void;
};

export function isOnDismountValid(object: any): boolean {
    return typeof object.onDismount == 'function';
}