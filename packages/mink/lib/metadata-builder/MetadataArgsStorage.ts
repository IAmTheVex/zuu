import {ControllerMetadataArgs} from "../metadata/args/ControllerMetadataArgs";
import {ActionMetadataArgs} from "../metadata/args/ActionMetadataArgs";
import {ParamMetadataArgs} from "../metadata/args/ParamMetadataArgs";
import {ResponseHandlerMetadataArgs} from "../metadata/args/ResponseHandleMetadataArgs";
import {MiddlewareMetadataArgs} from "../metadata/args/MiddlewareMetadataArgs";
import {UseMetadataArgs} from "../metadata/args/UseMetadataArgs";
import {UseInterceptorMetadataArgs} from "../metadata/args/UseInterceptorMetadataArgs";
import {InterceptorMetadataArgs} from "../metadata/args/InterceptorMetadataArgs";

export class MetadataArgsStorage {
    controllers: ControllerMetadataArgs[] = [];
    middlewares: MiddlewareMetadataArgs[] = [];
    interceptors: InterceptorMetadataArgs[] = [];
    uses: UseMetadataArgs[] = [];
    useInterceptors: UseInterceptorMetadataArgs[] = [];
    actions: ActionMetadataArgs[] = [];
    params: ParamMetadataArgs[] = [];
    responseHandlers: ResponseHandlerMetadataArgs[] = [];

    filterMiddlewareMetadatasForClasses(classes: Function[]): MiddlewareMetadataArgs[] {
        return classes
            .map(cls => this.middlewares.find(mid => mid.target === cls))
            .filter(midd => midd !== undefined); // this might be not needed if all classes where decorated with `@Middleware`
    }

    filterInterceptorMetadatasForClasses(classes: Function[]): InterceptorMetadataArgs[] {
        return this.interceptors.filter(ctrl => {
            return classes.filter(cls => ctrl.target === cls).length > 0;
        });
    }

    filterControllerMetadatasForClasses(classes: Function[]): ControllerMetadataArgs[] {
        return this.controllers.filter(ctrl => {
            return classes.filter(cls => ctrl.target === cls).length > 0;
        });
    }

    filterActionsWithTarget(target: Function): ActionMetadataArgs[] {
        return this.actions.filter(action => action.target === target);
    }

    filterUsesWithTargetAndMethod(target: Function, methodName: string): UseMetadataArgs[] {
        return this.uses.filter(use => {
            return use.target === target && use.method === methodName;
        });
    }

    filterInterceptorUsesWithTargetAndMethod(target: Function, methodName: string): UseInterceptorMetadataArgs[] {
        return this.useInterceptors.filter(use => {
            return use.target === target && use.method === methodName;
        });
    }

    filterParamsWithTargetAndMethod(target: Function, methodName: string): ParamMetadataArgs[] {
        return this.params.filter(param => {
            return param.object.constructor === target && param.method === methodName;
        });
    }

    filterResponseHandlersWithTarget(target: Function): ResponseHandlerMetadataArgs[] {
        return this.responseHandlers.filter(property => {
            return property.target === target;
        });
    }

    filterResponseHandlersWithTargetAndMethod(target: Function, methodName: string): ResponseHandlerMetadataArgs[] {
        return this.responseHandlers.filter(property => {
            return property.target === target && property.method === methodName;
        });
    }

    reset() {
        this.controllers = [];
        this.middlewares = [];
        this.interceptors = [];
        this.uses = [];
        this.useInterceptors = [];
        this.actions = [];
        this.params = [];
        this.responseHandlers = [];
    }

}