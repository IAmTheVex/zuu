import {getMetadataArgsStorage} from "../index";

export function Params(): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "params",
            object: object,
            method: methodName,
            index: index,
            parse: false,
            required: false,
            classTransform: undefined
        });
    };
}