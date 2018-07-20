import {ActionMetadata} from "../metadata/ActionMetadata";
import {ControllerMetadata} from "../metadata/ControllerMetadata";
import {InterceptorMetadata} from "../metadata/InterceptorMetadata";
import {MiddlewareMetadata} from "../metadata/MiddlewareMetadata";
import {ParamMetadata} from "../metadata/ParamMetadata";
import { ParamMetadataArgs } from "../metadata/args/ParamMetadataArgs";
import {ResponseHandlerMetadata} from "../metadata/ResponseHandleMetadata";
import { MinkOptions } from "../MinkOptions";
import {UseMetadata} from "../metadata/UseMetadata";
import {getMetadataArgsStorage} from "../index";

export class MetadataBuilder {
    constructor(private options: MinkOptions) { }

    buildControllerMetadata(classes?: Function[]) {
        return this.createControllers(classes);
    }

    buildMiddlewareMetadata(classes?: Function[]): MiddlewareMetadata[] {
        return this.createMiddlewares(classes);
    }

    buildInterceptorMetadata(classes?: Function[]): InterceptorMetadata[] {
        return this.createInterceptors(classes);
    }

    protected createMiddlewares(classes?: Function[]): MiddlewareMetadata[] {
        const middlewares = !classes ? getMetadataArgsStorage().middlewares : getMetadataArgsStorage().filterMiddlewareMetadatasForClasses(classes);
        return middlewares.map(middlewareArgs => new MiddlewareMetadata(middlewareArgs));
    }

    protected createInterceptors(classes?: Function[]): InterceptorMetadata[] {
        const interceptors = !classes ? getMetadataArgsStorage().interceptors : getMetadataArgsStorage().filterInterceptorMetadatasForClasses(classes);
        return interceptors.map(interceptorArgs => new InterceptorMetadata({
            target: interceptorArgs.target,
            method: undefined,
            interceptor: interceptorArgs.target
        }));
    }

    protected createControllers(classes?: Function[]): ControllerMetadata[] {
        const controllers = !classes ? getMetadataArgsStorage().controllers : getMetadataArgsStorage().filterControllerMetadatasForClasses(classes);
        return controllers.map(controllerArgs => {
            const controller = new ControllerMetadata(controllerArgs);
            controller.build(this.createControllerResponseHandlers(controller));
            controller.actions = this.createActions(controller);
            controller.uses = this.createControllerUses(controller);
            controller.interceptors = this.createControllerInterceptorUses(controller);
            return controller;
        });
    }

    protected createActions(controller: ControllerMetadata): ActionMetadata[] {
        return getMetadataArgsStorage()
            .filterActionsWithTarget(controller.target)
            .map(actionArgs => {
                const action = new ActionMetadata(controller, actionArgs, this.options);
                action.params = this.createParams(action);
                action.uses = this.createActionUses(action);
                action.interceptors = this.createActionInterceptorUses(action);
                action.build(this.createActionResponseHandlers(action));
                return action;
            });
    }

    protected createParams(action: ActionMetadata): ParamMetadata[] {
        return getMetadataArgsStorage()
            .filterParamsWithTargetAndMethod(action.target, action.method)
            .map(paramArgs => new ParamMetadata(action, this.decorateDefaultParamOptions(paramArgs)));
    }

    private decorateDefaultParamOptions(paramArgs: ParamMetadataArgs) {
        let options = this.options.defaults && this.options.defaults.paramOptions;
        if (!options)
            return paramArgs;
        
        if (paramArgs.required === undefined)
            paramArgs.required = options.required || false;

        return paramArgs;
    }

    protected createActionResponseHandlers(action: ActionMetadata): ResponseHandlerMetadata[] {
        return getMetadataArgsStorage()
            .filterResponseHandlersWithTargetAndMethod(action.target, action.method)
            .map(handlerArgs => new ResponseHandlerMetadata(handlerArgs));
    }

    protected createControllerResponseHandlers(controller: ControllerMetadata): ResponseHandlerMetadata[] {
        return getMetadataArgsStorage()
            .filterResponseHandlersWithTarget(controller.target)
            .map(handlerArgs => new ResponseHandlerMetadata(handlerArgs));
    }

    protected createActionUses(action: ActionMetadata): UseMetadata[] {
        return getMetadataArgsStorage()
            .filterUsesWithTargetAndMethod(action.target, action.method)
            .map(useArgs => new UseMetadata(useArgs));
    }

    protected createActionInterceptorUses(action: ActionMetadata): InterceptorMetadata[] {
        return getMetadataArgsStorage()
            .filterInterceptorUsesWithTargetAndMethod(action.target, action.method)
            .map(useArgs => new InterceptorMetadata(useArgs));
    }

    protected createControllerUses(controller: ControllerMetadata): UseMetadata[] {
        return getMetadataArgsStorage()
            .filterUsesWithTargetAndMethod(controller.target, undefined)
            .map(useArgs => new UseMetadata(useArgs));
    }
    
    protected createControllerInterceptorUses(controller: ControllerMetadata): InterceptorMetadata[] {
        return getMetadataArgsStorage()
            .filterInterceptorUsesWithTargetAndMethod(controller.target, undefined)
            .map(useArgs => new InterceptorMetadata(useArgs));
    }

}
