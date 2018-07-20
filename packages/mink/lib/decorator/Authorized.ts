import {getMetadataArgsStorage} from "../index";

export function Authorized(): Function;
export function Authorized(role: any): Function;
export function Authorized(roles: any[]): Function;
export function Authorized(role: Function): Function;
export function Authorized(roleOrRoles?: string|string[]|Function): Function {
    return function (clsOrObject: Function|Object, method?: string) {
        getMetadataArgsStorage().responseHandlers.push({
            type: "authorized",
            target: method ? clsOrObject.constructor : clsOrObject as Function,
            method: method,
            value: roleOrRoles
        });
    };
}