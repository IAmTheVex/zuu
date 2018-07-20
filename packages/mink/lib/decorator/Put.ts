import {getMetadataArgsStorage} from "../index";

export function Put(route?: RegExp): Function;
export function Put(route?: string): Function;
export function Put(route?: string|RegExp): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().actions.push({
            type: "put",
            target: object.constructor,
            method: methodName,
            route: route
        });
    };
}
