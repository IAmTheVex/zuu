import {getMetadataArgsStorage} from "../index";

export function Post(route?: RegExp): Function;
export function Post(route?: string): Function;
export function Post(route?: string|RegExp): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().actions.push({
            type: "post",
            target: object.constructor,
            method: methodName,
            route: route
        });
    };
}
