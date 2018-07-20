import {getMetadataArgsStorage} from "../index";

export function Head(route?: RegExp): Function;
export function Head(route?: string): Function;
export function Head(route?: string|RegExp): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().actions.push({
            type: "head",
            target: object.constructor,
            method: methodName,
            route: route
        });
    };
}