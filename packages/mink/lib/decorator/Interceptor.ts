import {getMetadataArgsStorage} from "../index";

export function Interceptor(options?: { priority?: number }): Function {
    return function (target: Function) {
        getMetadataArgsStorage().interceptors.push({
            target: target,
            global: true,
            priority: options && options.priority ? options.priority : 0
        });
    };
}
