import {Action} from "../Action";
import {ActionMetadataArgs} from "./args/ActionMetadataArgs";
import {ActionType} from "./types/ActionType";
import {ClassTransformOptions} from "class-transformer";
import {ControllerMetadata} from "./ControllerMetadata";
import {InterceptorMetadata} from "./InterceptorMetadata";
import {ParamMetadata} from "./ParamMetadata";
import {ResponseHandlerMetadata} from "./ResponseHandleMetadata";
import { MinkOptions } from "../MinkOptions";
import {UseMetadata} from "./UseMetadata";

export class ActionMetadata {
    controllerMetadata: ControllerMetadata;
    params: ParamMetadata[];
    uses: UseMetadata[];
    interceptors: InterceptorMetadata[];
    target: Function;
    method: string;
    type: ActionType;
    route: string | RegExp;
    fullRoute: string | RegExp;
    isBodyUsed: boolean;
    isFileUsed: boolean;
    isFilesUsed: boolean;
    isJsonTyped: boolean;
    isAuthorizedUsed: boolean;
    responseClassTransformOptions: ClassTransformOptions;
    undefinedResultCode: number | Function;
    nullResultCode: number | Function;
    successHttpCode: number;
    redirect: string;
    renderedTemplate: string;
    headers: { [name: string]: any };
    bodyExtraOptions: any;
    authorizedRoles: any[];

    appendParams?: (action: Action) => any[];
    methodOverride?: (actionMetadata: ActionMetadata, action: Action, params: any[]) => Promise<any> | any;

    constructor(controllerMetadata: ControllerMetadata, args: ActionMetadataArgs, private options: MinkOptions) {
        this.controllerMetadata = controllerMetadata;
        this.route = args.route;
        this.target = args.target;
        this.method = args.method;
        this.type = args.type;
        this.appendParams = args.appendParams;
        this.methodOverride = args.methodOverride;
    }

    build(responseHandlers: ResponseHandlerMetadata[]) {
        const classTransformerResponseHandler = responseHandlers.find(handler => handler.type === "response-class-transform-options");
        const undefinedResultHandler = responseHandlers.find(handler => handler.type === "on-undefined");
        const nullResultHandler = responseHandlers.find(handler => handler.type === "on-null");
        const successCodeHandler = responseHandlers.find(handler => handler.type === "success-code");
        const redirectHandler = responseHandlers.find(handler => handler.type === "redirect");
        const renderedTemplateHandler = responseHandlers.find(handler => handler.type === "rendered-template");
        const authorizedHandler = responseHandlers.find(handler => handler.type === "authorized");
        const contentTypeHandler = responseHandlers.find(handler => handler.type === "content-type");
        const bodyParam = this.params.find(param => param.type === "body");

        if (classTransformerResponseHandler)
            this.responseClassTransformOptions = classTransformerResponseHandler.value;
        
        this.undefinedResultCode = undefinedResultHandler
            ? undefinedResultHandler.value
            : this.options.defaults && this.options.defaults.undefinedResultCode;
        
        this.nullResultCode = nullResultHandler
            ? nullResultHandler.value
            : this.options.defaults && this.options.defaults.nullResultCode;
        
        if (successCodeHandler)
            this.successHttpCode = successCodeHandler.value;
        if (redirectHandler)
            this.redirect = redirectHandler.value;
        if (renderedTemplateHandler)
            this.renderedTemplate = renderedTemplateHandler.value;

        this.bodyExtraOptions = bodyParam ? bodyParam.extraOptions : undefined;
        this.isBodyUsed = !!this.params.find(param => param.type === "body" || param.type === "body-param");
        this.isFilesUsed = !!this.params.find(param => param.type === "files");
        this.isFileUsed = !!this.params.find(param => param.type === "file");
        this.isJsonTyped = (contentTypeHandler !== undefined 
            ? /json/.test(contentTypeHandler.value)
            : this.controllerMetadata.type === "json"
        );
        this.fullRoute = this.buildFullRoute();
        this.headers = this.buildHeaders(responseHandlers);

        this.isAuthorizedUsed = this.controllerMetadata.isAuthorizedUsed || !!authorizedHandler;
        this.authorizedRoles = (this.controllerMetadata.authorizedRoles || []).concat((authorizedHandler && authorizedHandler.value) || []);
    }

    private buildFullRoute(): string | RegExp {
        if (this.route instanceof RegExp) {
            if (this.controllerMetadata.route) {
                return ActionMetadata.appendBaseRoute(this.controllerMetadata.route, this.route);
            }
            return this.route;
        }

        let path: string = "";
        if (this.controllerMetadata.route) path += this.controllerMetadata.route;
        if (this.route && typeof this.route === "string") path += this.route;
        return path;
    }

    private buildHeaders(responseHandlers: ResponseHandlerMetadata[]) {
        const contentTypeHandler = responseHandlers.find(handler => handler.type === "content-type");
        const locationHandler = responseHandlers.find(handler => handler.type === "location");

        const headers: { [name: string]: string } = {};
        if (locationHandler)
            headers["Location"] = locationHandler.value;

        if (contentTypeHandler)
            headers["Content-type"] = contentTypeHandler.value;

        const headerHandlers = responseHandlers.filter(handler => handler.type === "header");
        if (headerHandlers)
            headerHandlers.map(handler => headers[handler.value] = handler.secondaryValue);

        return headers;
    }

    callMethod(params: any[]) {
        const controllerInstance = this.controllerMetadata.instance;
        return controllerInstance[this.method].apply(controllerInstance, params);
    }

    static appendBaseRoute(baseRoute: string, route: RegExp|string) {
        const prefix = `${baseRoute.length > 0 && baseRoute.indexOf("/") < 0 ? "/" : ""}${baseRoute}`;
        if (typeof route === "string")
            return `${prefix}${route}`;

        if (!baseRoute || baseRoute === "") return route;

        const fullPath = `^${prefix}${route.toString().substr(1)}?$`;
        
        return new RegExp(fullPath, route.flags);
    }

}