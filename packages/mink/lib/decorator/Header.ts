import {getMetadataArgsStorage} from "../index";

export function Header(name: string, value: string): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "header",
            target: object.constructor,
            method: methodName,
            value: name,
            secondaryValue: value
        });
    };
}