import {getMetadataArgsStorage} from "../index";

export function Redirect(url: string): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "redirect",
            target: object.constructor,
            method: methodName,
            value: url
        });
    };
}
