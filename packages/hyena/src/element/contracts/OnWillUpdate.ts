export interface OnWillUpdate {
    onWillUpdate(): void;
};

export function isOnWillUpdateValid(object: any): boolean {
    return typeof object.onWillUpdate == 'function';
}