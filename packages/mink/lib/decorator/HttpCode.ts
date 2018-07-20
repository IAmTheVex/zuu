import {getMetadataArgsStorage} from "../index";

export function HttpCode(code: number): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "success-code",
            target: object.constructor,
            method: methodName,
            value: code
        });
    };
}
