import {getMetadataArgsStorage} from "../index";

export function State(objectName?: string): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "state",
            object: object,
            method: methodName,
            index: index,
            name: objectName,
            parse: false,
            required: true,
            classTransform: undefined
        });
    };
}