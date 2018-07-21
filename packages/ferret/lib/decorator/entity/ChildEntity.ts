import {getMetadataArgsStorage} from "../../";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {DiscriminatorValueMetadataArgs} from "../../metadata-args/DiscriminatorValueMetadataArgs";

export function ChildEntity(discriminatorValue?: any) {
    return function (target: Function) {

        // register a table metadata
        getMetadataArgsStorage().tables.push({
            target: target,
            type: "entity-child",
        } as TableMetadataArgs);

        // register discriminator value if it was provided
        if (discriminatorValue) {
            getMetadataArgsStorage().discriminatorValues.push({
                target: target,
                value: discriminatorValue
            } as DiscriminatorValueMetadataArgs);
        }
    };
}
