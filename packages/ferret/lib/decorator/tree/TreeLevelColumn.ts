import {getMetadataArgsStorage} from "../../";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

export function TreeLevelColumn(): Function {
    return function (object: Object, propertyName: string) {

        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "treeLevel",
            options: {}
        } as ColumnMetadataArgs);
    };
}
