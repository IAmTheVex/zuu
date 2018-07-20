import {AuthorizationChecker} from "./AuthorizationChecker";
import {ClassTransformOptions} from "class-transformer";
import {CurrentUserChecker} from "./CurrentUserChecker";
import { ParamOptions } from "./decorator-options/ParamOptions";
import {ValidatorOptions} from "class-validator";

export interface MinkOptions {
    cors?: boolean|Object;
    routePrefix?: string;
    controllers?: Function[]|string[];
    middlewares?: Function[]|string[];
    interceptors?: Function[]|string[];
    classTransformer?: boolean;
    classToPlainTransformOptions?: ClassTransformOptions;
    plainToClassTransformOptions?: ClassTransformOptions;
    validation?: boolean|ValidatorOptions;
    development?: boolean;
    defaultErrorHandler?: boolean;
    errorOverridingMap?: { [key: string]: any };
    authorizationChecker?: AuthorizationChecker;
    currentUserChecker?: CurrentUserChecker;
    defaults?: {
        nullResultCode?: number;
        undefinedResultCode?: number;
        paramOptions?: {
            required?: boolean;
        };
    };
}