import {getMetadataArgsStorage} from "../index";

export function CurrentUser(options?: { required?: boolean }) {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "current-user",
            object: object,
            method: methodName,
            index: index,
            parse: false,
            required: options ? options.required : undefined
        });
    };
}