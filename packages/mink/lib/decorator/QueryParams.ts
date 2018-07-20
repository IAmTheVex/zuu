import {getMetadataArgsStorage} from "../index";

export function QueryParams(): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "queries",
            object: object,
            method: methodName,
            index: index,
            parse: false,
            required: false
        });
    };
}