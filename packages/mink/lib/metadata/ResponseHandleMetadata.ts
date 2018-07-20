import {ResponseHandlerMetadataArgs} from "./args/ResponseHandleMetadataArgs";
import {ResponseHandlerType} from "./types/ResponseHandlerType";

export class ResponseHandlerMetadata {
    target: Function;
    method: string;
    type: ResponseHandlerType;
    value: any;
    secondaryValue: any;

    constructor(args: ResponseHandlerMetadataArgs) {
        this.target = args.target;
        this.method = args.method;
        this.type = args.type;
        this.value = args.value;
        this.secondaryValue = args.secondaryValue;
    }

}