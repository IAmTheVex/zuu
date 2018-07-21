import {getMetadataArgsStorage, IndexOptions} from "../";
import {IndexMetadataArgs} from "../metadata-args/IndexMetadataArgs";

export function Index(options?: IndexOptions): Function;

export function Index(name: string, options?: IndexOptions): Function;

export function Index(name: string, options: { synchronize: false }): Function;

export function Index(name: string, fields: string[], options?: IndexOptions): Function;

export function Index(fields: string[], options?: IndexOptions): Function;

export function Index(fields: (object?: any) => (any[]|{ [key: string]: number }), options?: IndexOptions): Function;

export function Index(name: string, fields: (object?: any) => (any[]|{ [key: string]: number }), options?: IndexOptions): Function;

export function Index(nameOrFieldsOrOptions?: string|string[]|((object: any) => (any[]|{ [key: string]: number }))|IndexOptions,
                      maybeFieldsOrOptions?: ((object?: any) => (any[]|{ [key: string]: number }))|IndexOptions|string[]|{ synchronize: false },
                      maybeOptions?: IndexOptions): Function {

    // normalize parameters
    const name = typeof nameOrFieldsOrOptions === "string" ? nameOrFieldsOrOptions : undefined;
    const fields = typeof nameOrFieldsOrOptions === "string" ? <((object?: any) => (any[]|{ [key: string]: number }))|string[]> maybeFieldsOrOptions : nameOrFieldsOrOptions as string[];
    let options = (typeof nameOrFieldsOrOptions === "object" && !Array.isArray(nameOrFieldsOrOptions)) ? nameOrFieldsOrOptions as IndexOptions : maybeOptions;
    if (!options)
        options = (typeof maybeFieldsOrOptions === "object" && !Array.isArray(maybeFieldsOrOptions)) ? maybeFieldsOrOptions as IndexOptions : maybeOptions;

    return function (clsOrObject: Function|Object, propertyName?: string) {

        getMetadataArgsStorage().indices.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : fields,
            synchronize: options && (options as { synchronize: false }).synchronize === false ? false : true,
            where: options ? options.where : undefined,
            unique: options && options.unique ? true : false,
            spatial: options && options.spatial ? true : false,
            fulltext: options && options.fulltext ? true : false,
            sparse: options && options.sparse ? true : false
        } as IndexMetadataArgs);
    };
}
