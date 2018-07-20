import {getMetadataArgsStorage} from "../index";

export function Location(url: string): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "location",
            target: object.constructor,
            method: methodName,
            value: url
        });
    };
}