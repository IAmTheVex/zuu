import {getMetadataArgsStorage, JoinColumnOptions} from "../../";
import {JoinColumnMetadataArgs} from "../../metadata-args/JoinColumnMetadataArgs";

export function JoinColumn(): Function;

export function JoinColumn(options: JoinColumnOptions): Function;

export function JoinColumn(options: JoinColumnOptions[]): Function;

export function JoinColumn(optionsOrOptionsArray?: JoinColumnOptions|JoinColumnOptions[]): Function {
    return function (object: Object, propertyName: string) {
        const options = optionsOrOptionsArray instanceof Array ? optionsOrOptionsArray : [optionsOrOptionsArray || {}];
        options.forEach(options => {
            getMetadataArgsStorage().joinColumns.push({
                target: object.constructor,
                propertyName: propertyName,
                name: options.name,
                referencedColumnName: options.referencedColumnName
            } as JoinColumnMetadataArgs);
        });
    };
}
