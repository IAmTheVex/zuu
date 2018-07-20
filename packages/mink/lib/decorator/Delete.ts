import {getMetadataArgsStorage} from "../index";

export function Delete(route?: RegExp): Function;
export function Delete(route?: string): Function;
export function Delete(route?: string|RegExp): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().actions.push({
            type: "delete",
            target: object.constructor,
            method: methodName,
            route: route
        });
    };
}
