import {getMetadataArgsStorage} from "../index";

export function Middleware(options: { type: "after"|"before", priority?: number }): Function {
    return function (target: Function) {
        getMetadataArgsStorage().middlewares.push({
            target: target,
            type: options && options.type ? options.type : "before",
            global: true,
            priority: options && options.priority !== undefined ? options.priority : 0
        });
    };
}