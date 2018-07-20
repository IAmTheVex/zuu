import {MiddlewareMetadataArgs} from "./args/MiddlewareMetadataArgs";
import {ExpressMiddlewareInterface} from "../driver/express/ExpressMiddlewareInterface";
import {ExpressErrorMiddlewareInterface} from "../driver/express/ExpressErrorMiddlewareInterface";
import {getFromContainer} from "../container";
import {KoaMiddlewareInterface} from "../driver/koa/KoaMiddlewareInterface";

export class MiddlewareMetadata {
    global: boolean;
    target: Function;
    priority: number;
    type: "before"|"after";

    constructor(args: MiddlewareMetadataArgs) {
        this.global = args.global;
        this.target = args.target;
        this.priority = args.priority;
        this.type = args.type;
    }

    get instance(): ExpressMiddlewareInterface|KoaMiddlewareInterface|ExpressErrorMiddlewareInterface {
        return getFromContainer<ExpressMiddlewareInterface|KoaMiddlewareInterface|ExpressErrorMiddlewareInterface>(this.target);
    }
    
}