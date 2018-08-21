export interface OnMount {
    onMount(): void;
};

export function isOnMountValid(object: any): boolean {
    return typeof object.onMount == 'function';
}