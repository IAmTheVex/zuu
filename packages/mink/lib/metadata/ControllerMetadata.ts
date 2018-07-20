import {ActionMetadata} from "./ActionMetadata";
import {ControllerMetadataArgs} from "./args/ControllerMetadataArgs";
import {UseMetadata} from "./UseMetadata";
import {getFromContainer} from "../container";
import {ResponseHandlerMetadata} from "./ResponseHandleMetadata";
import {InterceptorMetadata} from "./InterceptorMetadata";

export class ControllerMetadata {
    actions: ActionMetadata[];
    target: Function;
    route: string;
    type: "default"|"json";
    uses: UseMetadata[];
    interceptors: InterceptorMetadata[];
    isAuthorizedUsed: boolean;
    authorizedRoles: any[];

    constructor(args: ControllerMetadataArgs) {
        this.target = args.target;
        this.route = args.route;
        this.type = args.type;
    }

    get instance(): any {
        return getFromContainer(this.target);
    }

    build(responseHandlers: ResponseHandlerMetadata[]) {
        const authorizedHandler = responseHandlers.find(handler => handler.type === "authorized" && !handler.method);
        this.isAuthorizedUsed = !!authorizedHandler;
        this.authorizedRoles = [].concat((authorizedHandler && authorizedHandler.value) || []);
    }

}