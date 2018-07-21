import {ColumnOptions, getMetadataArgsStorage} from "../../";
import {PrimaryGeneratedColumnNumericOptions} from "../options/PrimaryGeneratedColumnNumericOptions";
import {PrimaryGeneratedColumnUUIDOptions} from "../options/PrimaryGeneratedColumnUUIDOptions";
import {GeneratedMetadataArgs} from "../../metadata-args/GeneratedMetadataArgs";

export function PrimaryGeneratedColumn(): Function;

export function PrimaryGeneratedColumn(options: PrimaryGeneratedColumnNumericOptions): Function;

export function PrimaryGeneratedColumn(strategy: "increment", options?: PrimaryGeneratedColumnNumericOptions): Function;

export function PrimaryGeneratedColumn(strategy: "uuid", options?: PrimaryGeneratedColumnUUIDOptions): Function;

export function PrimaryGeneratedColumn(strategyOrOptions?: "increment"|"uuid"|PrimaryGeneratedColumnNumericOptions|PrimaryGeneratedColumnUUIDOptions,
                                       maybeOptions?: PrimaryGeneratedColumnNumericOptions|PrimaryGeneratedColumnUUIDOptions): Function {

    // normalize parameters
    const options: ColumnOptions = {};
    let strategy: "increment"|"uuid";
    if (strategyOrOptions) {
        if (typeof strategyOrOptions === "string")
            strategy = strategyOrOptions as "increment"|"uuid";

        if (strategyOrOptions instanceof Object) {
            strategy = "increment";
            Object.assign(options, strategyOrOptions);
        }
    } else {
        strategy = "increment";
    }
    if (maybeOptions instanceof Object)
        Object.assign(options, maybeOptions);

    return function (object: Object, propertyName: string) {

        // if column type is not explicitly set then determine it based on generation strategy
        if (!options.type)
            options.type = strategy === "increment" ? Number : "uuid";

        // explicitly set a primary and generated to column options
        options.primary = true;

        // register column metadata args
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "regular",
            options: options
        });

        // register generated metadata args
        getMetadataArgsStorage().generations.push({
            target: object.constructor,
            propertyName: propertyName,
            strategy: strategy
        } as GeneratedMetadataArgs);
    };
}
