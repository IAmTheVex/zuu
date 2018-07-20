import {getMetadataArgsStorage} from "../index";
import {ActionType} from "../metadata/types/ActionType";

export function Method(method: ActionType, route?: RegExp): Function;
export function Method(method: ActionType, route?: string): Function;
export function Method(method: ActionType, route?: string|RegExp): Function {
    return function (object: Object, methodName: string) {
        getMetadataArgsStorage().actions.push({
            type: method,
            target: object.constructor,
            method: methodName,
            route: route
        });
    };
}
