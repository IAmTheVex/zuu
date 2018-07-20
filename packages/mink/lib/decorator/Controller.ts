import {getMetadataArgsStorage} from "../index";

export function Controller(baseRoute?: string): Function {
    return function (object: Function) {
        getMetadataArgsStorage().controllers.push({
            type: "default",
            target: object,
            route: baseRoute
        });
    };
}