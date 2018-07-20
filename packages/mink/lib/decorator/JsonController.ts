import {getMetadataArgsStorage} from "../index";

export function JsonController(baseRoute?: string) {
    return function (object: Function) {
        getMetadataArgsStorage().controllers.push({
            type: "json",
            target: object,
            route: baseRoute
        });
    };
}
