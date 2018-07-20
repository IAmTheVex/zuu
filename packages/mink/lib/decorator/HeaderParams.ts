import {getMetadataArgsStorage} from "../index";

export function HeaderParams(): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "headers",
            object: object,
            method: methodName,
            index: index,
            parse: false,
            required: false
        });
    };
}