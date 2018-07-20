export type ResolverInterface<T extends object> = {
    [P in keyof T]?: (root: T, ...args: any[]) => T[P] | Promise<T[P]>
};
