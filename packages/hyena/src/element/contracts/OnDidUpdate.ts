export interface OnDidUpdate {
    onDidUpdate(): void;
};

export function isOnDidUpdateValid(object: any): boolean {
    return typeof object.onDidUpdate == 'function';
}