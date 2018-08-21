import { DirectiveFn, NodePart } from "../core";
export declare const asyncReplace: <T>(value: AsyncIterable<T>, mapper?: (v: T, index?: number) => any) => DirectiveFn<NodePart>;
