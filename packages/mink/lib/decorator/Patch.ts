import {getMetadataArgsStorage} from "../index";

export function Patch(route?: RegExp): Function;
export function Patch(route?: string): Function;
export function Patch(route?: string|RegExp): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().actions.push({
            type: "patch",
            target: object.constructor,
            method: methodName,
            route: route
        });
    };
}