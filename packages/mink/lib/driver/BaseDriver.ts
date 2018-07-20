import {ValidatorOptions} from "class-validator";
import {ClassTransformOptions, classToPlain} from "class-transformer";

import {HttpError} from "../http-error/HttpError";
import {CurrentUserChecker} from "../CurrentUserChecker";
import {AuthorizationChecker} from "../AuthorizationChecker";
import {ActionMetadata} from "../metadata/ActionMetadata";
import {ParamMetadata} from "../metadata/ParamMetadata";
import {MiddlewareMetadata} from "../metadata/MiddlewareMetadata";
import {Action} from "../Action";

export abstract class BaseDriver {
    app: any;
    useClassTransformer: boolean;
    enableValidation: boolean;
    classToPlainTransformOptions: ClassTransformOptions;
    validationOptions: ValidatorOptions;
    plainToClassTransformOptions: ClassTransformOptions;
    isDefaultErrorHandlingEnabled: boolean;
    developmentMode: boolean;
    routePrefix: string = "";
    cors?: boolean|Object;
    errorOverridingMap: { [key: string]: any };
    authorizationChecker?: AuthorizationChecker;
    currentUserChecker?: CurrentUserChecker;

    abstract initialize(): void;
    
    abstract registerMiddleware(middleware: MiddlewareMetadata): void;

    abstract registerAction(action: ActionMetadata, executeCallback: (options: Action) => any): void;

    abstract registerRoutes(): void;

    abstract getParamFromRequest(actionOptions: Action, param: ParamMetadata): any;

    abstract handleError(error: any, action: ActionMetadata, options: Action): any;

    abstract handleSuccess(result: any, action: ActionMetadata, options: Action): void;

    protected transformResult(result: any, action: ActionMetadata, options: Action): any {
        const shouldTransform = (this.useClassTransformer && result != null)
            && result instanceof Object
            && !(
                result instanceof Uint8Array
                ||
                result.pipe instanceof Function
            );
            
        if (shouldTransform) {
            const options = action.responseClassTransformOptions || this.classToPlainTransformOptions;
            result = classToPlain(result, options);
        }

        return result;
    }

    protected processJsonError(error: any) {
        if (!this.isDefaultErrorHandlingEnabled)
            return error;

        if (typeof error.toJSON === "function")
            return error.toJSON();
        
        let processedError: any = {};
        if (error instanceof Error) {
            const name = error.name && error.name !== "Error" ? error.name : error.constructor.name;
            processedError.name = name;

            if (error.message)
                processedError.message = error.message;
            if (error.stack && this.developmentMode)
                processedError.stack = error.stack;

            Object.keys(error)
                .filter(key => key !== "stack" && key !== "name" && key !== "message" && (!(error instanceof HttpError) || key !== "httpCode"))
                .forEach(key => processedError[key] = (error as any)[key]);

            if (this.errorOverridingMap)
                Object.keys(this.errorOverridingMap)
                    .filter(key => name === key)
                    .forEach(key => processedError = this.merge(processedError, this.errorOverridingMap[key]));

            return Object.keys(processedError).length > 0 ? processedError : undefined;
        }

        return error;
    }

    protected processTextError(error: any) {
        if (!this.isDefaultErrorHandlingEnabled)
            return error;

        if (error instanceof Error) {
            if (this.developmentMode && error.stack) {
                return error.stack;

            } else if (error.message) {
                return error.message;
            }
        }
        return error;
    }

    protected merge(obj1: any, obj2: any): any {
        const result: any = {};
        for (let i in obj1) {
            if ((i in obj2) && (typeof obj1[i] === "object") && (i !== null)) {
                result[i] = this.merge(obj1[i], obj2[i]);
            } else {
                result[i] = obj1[i];
            }
        }
        for (let i in obj2) {
            result[i] = obj2[i];
        }
        return result;
    }

}
