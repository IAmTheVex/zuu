export interface Updateable {
    update(): void;
};

export function isUpdatable(object: any): boolean {
    return typeof object.update == 'function';
}