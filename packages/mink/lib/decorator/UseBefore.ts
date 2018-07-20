import {getMetadataArgsStorage} from "../index";

export function UseBefore(...middlewares: Array<Function>): Function;
export function UseBefore(...middlewares: Array<(context: any, next: () => Promise<any>) => Promise<any>>): Function;
export function UseBefore(...middlewares: Array<(request: any, response: any, next: Function) => any>): Function;
export function UseBefore(...middlewares: Array<Function|((request: any, response: any, next: Function) => any)>): Function {
    return function (objectOrFunction: Object|Function, methodName?: string) {
        middlewares.forEach(middleware => {
            getMetadataArgsStorage().uses.push({
                target: methodName ? objectOrFunction.constructor : objectOrFunction as Function,
                method: methodName,
                middleware: middleware,
                afterAction: false
            });
        });
    };
}
