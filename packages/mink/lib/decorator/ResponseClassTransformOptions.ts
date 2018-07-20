import {getMetadataArgsStorage} from "../index";
import {ClassTransformOptions} from "class-transformer";

export function ResponseClassTransformOptions(options: ClassTransformOptions): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "response-class-transform-options",
            value: options,
            target: object.constructor,
            method: methodName
        });
    };
}
