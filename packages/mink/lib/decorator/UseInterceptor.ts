import {getMetadataArgsStorage} from "../index";
import {Action} from "../Action";

export function UseInterceptor(...interceptors: Array<Function>): Function;
export function UseInterceptor(...interceptors: Array<(action: Action, result: any) => any>): Function;
export function UseInterceptor(...interceptors: Array<Function|((action: Action, result: any) => any)>): Function {
    return function (objectOrFunction: Object|Function, methodName?: string) {
        interceptors.forEach(interceptor => {
            getMetadataArgsStorage().useInterceptors.push({
                interceptor: interceptor,
                target: methodName ? objectOrFunction.constructor : objectOrFunction as Function,
                method: methodName,
            });
        });
    };
}
