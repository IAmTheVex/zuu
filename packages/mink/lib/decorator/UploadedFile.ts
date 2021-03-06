import {UploadOptions} from "../decorator-options/UploadOptions";
import {getMetadataArgsStorage} from "../index";

export function UploadedFile(name: string, options?: UploadOptions): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "file",
            object: object,
            method: methodName,
            index: index,
            name: name,
            parse: false,
            required: options ? options.required : undefined,
            extraOptions: options ? options.options : undefined
        });
    };
}