import {ColumnOptions, getMetadataArgsStorage} from "../../";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

export function UpdateDateColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {

        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "updateDate",
            options: options ? options : {}
        } as ColumnMetadataArgs);
    };
}

