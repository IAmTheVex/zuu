import {getMetadataArgsStorage} from "../index";

export function ContentType(contentType: string): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "content-type",
            target: object.constructor,
            method: methodName,
            value: contentType
        });
    };
}