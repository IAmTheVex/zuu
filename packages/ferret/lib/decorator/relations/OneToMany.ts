import {getMetadataArgsStorage, ObjectType, RelationOptions} from "../../";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

export function OneToMany<T>(typeFunction: (type?: any) => ObjectType<T>, inverseSide: string|((object: T) => any), options?: RelationOptions): Function {
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
            isLazy: isLazy,
            relationType: "one-to-many",
            type: typeFunction,
            inverseSideProperty: inverseSide,
            options: options
        } as RelationMetadataArgs);
    };
}
