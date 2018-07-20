import {getMetadataArgsStorage} from "../index";

export function CookieParams() {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "cookies",
            object: object,
            method: methodName,
            index: index,
            parse: false,
            required: false
        });
    };
}