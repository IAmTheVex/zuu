import { IReflectedObject } from "./IReflectedObject";

/**
 * Reflected type object
 */
export class ReflectedType implements IReflectedObject {
    public constructor(
        /**
         * Internal type
         */
        public internal: any, 
        
        /**
         * Reflected name
         */
        public name: string, 
        
        /**
         * Reflected circularity
         * (depends on reflection target)
         */
        public circular: boolean,

        /**
         * Reflected quality of primitive type
         */
        public primitive: boolean
    ) {};
}
