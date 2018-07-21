import {getMetadataArgsStorage} from "../../";
import {TreeMetadataArgs} from "../../metadata-args/TreeMetadataArgs";
import {TreeType} from "../../metadata/types/TreeTypes";

export function Tree(type: TreeType): Function {
    return function (target: Function) {

        getMetadataArgsStorage().trees.push({
            target: target,
            type: type
        } as TreeMetadataArgs);
    };
}
