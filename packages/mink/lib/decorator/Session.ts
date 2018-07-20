import { ParamOptions } from "../decorator-options/ParamOptions";
import { getMetadataArgsStorage } from "../index";

export function Session(options?: ParamOptions): ParameterDecorator;
export function Session(propertyName: string, options?: ParamOptions): ParameterDecorator;
export function Session(optionsOrObjectName?: ParamOptions|string, paramOptions?: ParamOptions): ParameterDecorator {
    let propertyName: string|undefined;
    let options: ParamOptions|undefined;
    if (typeof optionsOrObjectName === "string") {
        propertyName = optionsOrObjectName;
        options = paramOptions || {};
    } else {
        options = optionsOrObjectName || {};
    }

    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "session",
            object: object,
            method: methodName,
            index: index,
            name: propertyName,
            parse: false,
            required: options.required !== undefined ? options.required : true,
            classTransform: options.transform,
            validate: options.validate !== undefined ? options.validate : false,
        });
    };
}