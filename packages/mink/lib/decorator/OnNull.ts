import {getMetadataArgsStorage} from "../index";

export function OnNull(code: number): Function;
export function OnNull(error: Function): Function;
export function OnNull(codeOrError: number|Function): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "on-null",
            target: object.constructor,
            method: methodName,
            value: codeOrError
        });
    };
}
