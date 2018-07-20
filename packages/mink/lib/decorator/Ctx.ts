import {getMetadataArgsStorage} from "../index";

export function Ctx(): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "context",
            object: object,
            method: methodName,
            index: index,
            parse: false,
            required: false
        });
    };
}
