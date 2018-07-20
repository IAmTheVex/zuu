import {getMetadataArgsStorage} from "../index";

export function Req(): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "request",
            object: object,
            method: methodName,
            index: index,
            parse: false,
            required: false
        });
    };
}