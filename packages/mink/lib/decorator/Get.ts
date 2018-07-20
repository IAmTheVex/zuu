import {getMetadataArgsStorage} from "../index";

export function Get(route?: RegExp): Function;
export function Get(route?: string): Function;
export function Get(route?: string|RegExp): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().actions.push({
            type: "get",
            target: object.constructor,
            method: methodName,
            route: route
        });
    };
}