import {RelationMetadata} from "../metadata/RelationMetadata";

export class InitializedRelationError extends Error {

    constructor(relation: RelationMetadata) {
        super();
        Object.setPrototypeOf(this, InitializedRelationError.prototype);
        this.message = `Array initializations are not allowed in entity relations. ` +
                        `Please remove array initialization (= []) from "${relation.entityMetadata.targetName}#${relation.propertyPath}". ` +
                        `This is ORM requirement to make relations to work properly. Refer docs for more information.`;
    }

}