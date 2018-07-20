import {getMetadataArgsStorage} from "../index";

export function Res(): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "response",
            object: object,
            method: methodName,
            index: index,
            parse: false,
            required: false
        });
    };
}
