import {UseMetadataArgs} from "./args/UseMetadataArgs";

export class UseMetadata {
    target: Function;
    method: string;
    middleware: Function;
    afterAction: boolean;

    constructor(args: UseMetadataArgs) {
        this.target = args.target;
        this.method = args.method;
        this.middleware = args.middleware;
        this.afterAction = args.afterAction;
    }
    
}