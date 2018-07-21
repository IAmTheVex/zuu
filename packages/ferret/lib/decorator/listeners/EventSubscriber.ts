import {getMetadataArgsStorage} from "../../";
import {EntitySubscriberMetadataArgs} from "../../metadata-args/EntitySubscriberMetadataArgs";

export function EventSubscriber() {
    return function (target: Function) {

        getMetadataArgsStorage().entitySubscribers.push({
            target: target
        } as EntitySubscriberMetadataArgs);
    };
}