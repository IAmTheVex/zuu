import {getMetadataArgsStorage} from "../";
import {EntityRepositoryMetadataArgs} from "../metadata-args/EntityRepositoryMetadataArgs";

export function EntityRepository(entity?: Function): Function {
    return function (target: Function) {

        getMetadataArgsStorage().entityRepositories.push({
            target: target,
            entity: entity,
        } as EntityRepositoryMetadataArgs);
    };
}
