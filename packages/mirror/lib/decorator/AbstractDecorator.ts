import { IDecoration } from "./IDecoration";
import { MirrorType } from "../type/MirrorType";

/**
 * Abstract base for decorators that accept T decorations
 */
export abstract class AbstractDecorator<T extends IDecoration> {
    /**
     * Type of the reflection emitted by the mirror
     */
    public type: MirrorType;

    /**
     * Internal namespace of the annotation (must be unique)
     */
    public namespace: string;

    public constructor(type: MirrorType, namespace: string) {
        this.type = type;
        this.namespace = namespace;
    }

    /**
     * Provides feedback from the Mirror system
     * 
     * @param instance T: the decoration received when annotating an target
     * @param target any: the decorated target
     * @param key? symbol|string: the decorated target's key
     * @param index? number: index of decorated parameter
     */
    public abstract annotate(instance: T, target: any, key?: (symbol | string), index?: number);
}
