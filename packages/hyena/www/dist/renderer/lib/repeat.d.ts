import { DirectiveFn, NodePart } from "../core";
export declare type KeyFn<T> = (item: T) => any;
export declare type ItemTemplate<T> = (item: T, index: number) => any;
export declare function repeat<T>(items: T[], keyFn: KeyFn<T>, template: ItemTemplate<T>): DirectiveFn<NodePart>;
export declare function repeat<T>(items: T[], template: ItemTemplate<T>): DirectiveFn<NodePart>;
