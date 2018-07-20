import {UseInterceptorMetadataArgs} from "./args/UseInterceptorMetadataArgs";

export class InterceptorMetadata {
    target: Function;
    method: string;
    interceptor: Function;
    global: boolean;
    priority: number;
 
    constructor(args: UseInterceptorMetadataArgs) {
        this.target = args.target;
        this.method = args.method;
        this.interceptor = args.interceptor;
        this.priority = args.priority;
        this.global = args.global;
    }
    
}