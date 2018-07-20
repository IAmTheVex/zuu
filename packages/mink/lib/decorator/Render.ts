import {getMetadataArgsStorage} from "../index";

export function Render(template: string): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "rendered-template",
            target: object.constructor,
            method: methodName,
            value: template
        });
    };
}