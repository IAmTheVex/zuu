import {getMetadataArgsStorage} from "../index";

export function OnUndefined(code: number): Function;
export function OnUndefined(error: Function): Function;
export function OnUndefined(codeOrError: number|Function): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "on-undefined",
            target: object.constructor,
            method: methodName,
            value: codeOrError
        });
    };
}
