import {ColumnOptions, getMetadataArgsStorage} from "../../";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

export function CreateDateColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "createDate",
            options: options || {}
        } as ColumnMetadataArgs);
    };
}
