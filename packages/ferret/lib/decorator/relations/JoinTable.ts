import {getMetadataArgsStorage, JoinTableOptions} from "../../";
import {JoinTableMetadataArgs} from "../../metadata-args/JoinTableMetadataArgs";
import {JoinTableMultipleColumnsOptions} from "../options/JoinTableMuplipleColumnsOptions";

export function JoinTable(): Function;

export function JoinTable(options: JoinTableOptions): Function;

export function JoinTable(options: JoinTableMultipleColumnsOptions): Function;

export function JoinTable(options?: JoinTableOptions|JoinTableMultipleColumnsOptions): Function {
    return function (object: Object, propertyName: string) {
        options = options || {} as JoinTableOptions|JoinTableMultipleColumnsOptions;
        getMetadataArgsStorage().joinTables.push({
            target: object.constructor,
            propertyName: propertyName,
            name: options.name,
            joinColumns: (options && (options as JoinTableOptions).joinColumn ? [(options as JoinTableOptions).joinColumn!] : (options as JoinTableMultipleColumnsOptions).joinColumns) as any,
            inverseJoinColumns: (options && (options as JoinTableOptions).inverseJoinColumn ? [(options as JoinTableOptions).inverseJoinColumn!] : (options as JoinTableMultipleColumnsOptions).inverseJoinColumns) as any,
            schema: options && options.schema ? options.schema : undefined,
            database: options && options.database ? options.database : undefined,
        } as JoinTableMetadataArgs);
    };
}
