import {getMetadataArgsStorage} from "../../";
import {RelationMetadataArgs} from "../../metadata-args/RelationMetadataArgs";

export function TreeParent(): Function {
    return function (object: Object, propertyName: string) {

        // now try to determine it its lazy relation
        const reflectedType = Reflect && (Reflect as any).getMetadata ? Reflect.getMetadata("design:type", object, propertyName) : undefined;
        const isLazy = (reflectedType && typeof reflectedType.name === "string" && reflectedType.name.toLowerCase() === "promise") || false;

        getMetadataArgsStorage().relations.push({
            isTreeParent: true,
            target: object.constructor,
            propertyName: propertyName,
            isLazy: isLazy,
            relationType: "many-to-one",
            type: () => object.constructor,
            options: {}
        } as RelationMetadataArgs);
    };
}
