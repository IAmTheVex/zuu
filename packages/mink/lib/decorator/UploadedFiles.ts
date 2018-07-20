import {UploadOptions} from "../decorator-options/UploadOptions";
import {getMetadataArgsStorage} from "../index";

export function UploadedFiles(name: string, options?: UploadOptions): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "files",
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