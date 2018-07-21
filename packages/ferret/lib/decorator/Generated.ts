import {getMetadataArgsStorage} from "../";
import {GeneratedMetadataArgs} from "../metadata-args/GeneratedMetadataArgs";

export function Generated(strategy: "increment"|"uuid" = "increment"): Function {
    return function (object: Object, propertyName: string) {

        getMetadataArgsStorage().generations.push({
            target: object.constructor,
            propertyName: propertyName,
            strategy: strategy
        } as GeneratedMetadataArgs);
    };
}
