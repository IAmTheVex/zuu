import {getMetadataArgsStorage, ObjectType, RelationOptions} from "../../";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

export function ManyToOne<T>(typeFunction: (type?: any) => ObjectType<T>, options?: RelationOptions): Function;

export function ManyToOne<T>(typeFunction: (type?: any) => ObjectType<T>,
                             inverseSide?: string|((object: T) => any),
                             options?: RelationOptions): Function;

export function ManyToOne<T>(typeFunction: (type?: any) => ObjectType<T>,
                             inverseSideOrOptions?: string|((object: T) => any)|RelationOptions,
                             options?: RelationOptions): Function {

    // normalize parameters
    let inverseSideProperty: string|((object: T) => any);
    if (typeof inverseSideOrOptions === "object") {
        options = <RelationOptions> inverseSideOrOptions;
    } else {
        inverseSideProperty = <string|((object: T) => any)> inverseSideOrOptions;
    }

    return function (object: Object, propertyName: string) {
        if (!options) options = {} as RelationOptions;

        // now try to determine it its lazy relation
        let isLazy = options && options.lazy === true ? true : false;
        if (!isLazy && Reflect && (Reflect as any).getMetadata) { // automatic determination
            const reflectedType = (Reflect as any).getMetadata("design:type", object, propertyName);
            if (reflectedType && typeof reflectedType.name === "string" && reflectedType.name.toLowerCase() === "promise")
                isLazy = true;
        }

        getMetadataArgsStorage().relations.push({
            target: object.constructor,
            propertyName: propertyName,
            // propertyType: reflectedType,
            relationType: "many-to-one",
            isLazy: isLazy,
            type: typeFunction,
            inverseSideProperty: inverseSideProperty,
            options: options
        } as RelationMetadataArgs);
    };
}
