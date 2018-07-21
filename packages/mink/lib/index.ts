import {CustomParameterDecorator} from "./CustomParameterDecorator";
import {BaseDriver} from "./driver/BaseDriver";
import {ExpressDriver} from "./driver/express/ExpressDriver";
import {KoaDriver} from "./driver/koa/KoaDriver";
import {MetadataArgsStorage} from "./metadata-builder/MetadataArgsStorage";
import {Mink} from "./Mink";
import {MinkOptions} from "./MinkOptions";
import {ValidationOptions} from "class-validator";
import {importClassesFromDirectories} from "./util/importClassesFromDirectories";

export * from "./container";

export * from "./decorator/Authorized";
export * from "./decorator/Body";
export * from "./decorator/BodyParam";
export * from "./decorator/ContentType";
export * from "./decorator/Controller";
export * from "./decorator/CookieParam";
export * from "./decorator/CookieParams";
export * from "./decorator/Ctx";
export * from "./decorator/CurrentUser";
export * from "./decorator/Delete";
export * from "./decorator/Get";
export * from "./decorator/Head";
export * from "./decorator/Header";
export * from "./decorator/HeaderParam";
export * from "./decorator/HeaderParams";
export * from "./decorator/HttpCode";
export * from "./decorator/Interceptor";
export * from "./decorator/JsonController";
export * from "./decorator/Location";
export * from "./decorator/Method";
export * from "./decorator/Middleware";
export * from "./decorator/OnNull";
export * from "./decorator/OnUndefined";
export * from "./decorator/Param";
export * from "./decorator/Params";
export * from "./decorator/Patch";
export * from "./decorator/Post";
export * from "./decorator/Put";
export * from "./decorator/QueryParam";
export * from "./decorator/QueryParams";
export * from "./decorator/Redirect";
export * from "./decorator/Render";
export * from "./decorator/Req";
export * from "./decorator/Res";
export * from "./decorator/ResponseClassTransformOptions";
export * from "./decorator/Session";
export * from "./decorator/State";
export * from "./decorator/UploadedFile";
export * from "./decorator/UploadedFiles";
export * from "./decorator/UseAfter";
export * from "./decorator/UseBefore";
export * from "./decorator/UseInterceptor";

export * from "./decorator-options/BodyOptions";
export * from "./decorator-options/ParamOptions";
export * from "./decorator-options/UploadOptions";

export * from "./http-error/HttpError";
export * from "./http-error/InternalServerError";
export * from "./http-error/BadRequestError";
export * from "./http-error/ForbiddenError";
export * from "./http-error/NotAcceptableError";
export * from "./http-error/MethodNotAllowedError";
export * from "./http-error/NotFoundError";
export * from "./http-error/UnauthorizedError";

export * from "./driver/express/ExpressMiddlewareInterface";
export * from "./driver/express/ExpressErrorMiddlewareInterface";
export * from "./driver/koa/KoaMiddlewareInterface";
export * from "./metadata-builder/MetadataArgsStorage";
export * from "./metadata/ActionMetadata";
export * from "./metadata/ControllerMetadata";
export * from "./metadata/InterceptorMetadata";
export * from "./metadata/MiddlewareMetadata";
export * from "./metadata/ParamMetadata";
export * from "./metadata/ResponseHandleMetadata";
export * from "./metadata/UseMetadata";

export * from "./MinkOptions";
export * from "./CustomParameterDecorator";
export * from "./RoleChecker";
export * from "./Action";
export * from "./InterceptorInterface";

export * from "./driver/BaseDriver";
export * from "./driver/express/ExpressDriver";
export * from "./driver/koa/KoaDriver";

export function getMetadataArgsStorage(): MetadataArgsStorage {
    if (!(global as any).MinkMetadataArgsStorage)
        (global as any).MinkMetadataArgsStorage = new MetadataArgsStorage();

    return (global as any).MinkMetadataArgsStorage;
}

export function useExpressServer<T>(expressApp: T, options?: MinkOptions): T {
    const driver = new ExpressDriver(expressApp);
    return createServer(driver, options);
}

export function createExpressServer(options?: MinkOptions): any {
    const driver = new ExpressDriver();
    return createServer(driver, options);
}

export function useKoaServer<T>(koaApp: T, options?: MinkOptions): T {
    const driver = new KoaDriver(koaApp);
    return createServer(driver, options);
}

export function createKoaServer(options?: MinkOptions): any {
    const driver = new KoaDriver();
    return createServer(driver, options);
}

export function createServer<T extends BaseDriver>(driver: T, options?: MinkOptions): any {
    createExecutor(driver, options);
    return driver.app;
}

export function createExecutor<T extends BaseDriver>(driver: T, options: MinkOptions = {}): void {
    let controllerClasses: Function[];
    if (options && options.controllers && options.controllers.length) {
        controllerClasses = (options.controllers as any[]).filter(controller => controller instanceof Function);
        const controllerDirs = (options.controllers as any[]).filter(controller => typeof controller === "string");
        controllerClasses.push(...importClassesFromDirectories(controllerDirs));
    }
    let middlewareClasses: Function[];
    if (options && options.middlewares && options.middlewares.length) {
        middlewareClasses = (options.middlewares as any[]).filter(controller => controller instanceof Function);
        const middlewareDirs = (options.middlewares as any[]).filter(controller => typeof controller === "string");
        middlewareClasses.push(...importClassesFromDirectories(middlewareDirs));
    }
    let interceptorClasses: Function[];
    if (options && options.interceptors && options.interceptors.length) {
        interceptorClasses = (options.interceptors as any[]).filter(controller => controller instanceof Function);
        const interceptorDirs = (options.interceptors as any[]).filter(controller => typeof controller === "string");
        interceptorClasses.push(...importClassesFromDirectories(interceptorDirs));
    }

    if (options && options.development !== undefined) {
        driver.developmentMode = options.development;
    } else {
        driver.developmentMode = process.env.NODE_ENV !== "production";
    }

    if (options.defaultErrorHandler !== undefined) {
        driver.isDefaultErrorHandlingEnabled = options.defaultErrorHandler;
    } else {
        driver.isDefaultErrorHandlingEnabled = true;
    }

    if (options.classTransformer !== undefined) {
        driver.useClassTransformer = options.classTransformer;
    } else {
        driver.useClassTransformer = true;
    }

    if (options.validation !== undefined) {
        driver.enableValidation = !!options.validation;
        if (options.validation instanceof Object)
            driver.validationOptions = options.validation as ValidationOptions;

    } else {
        driver.enableValidation = true;
    }

    driver.classToPlainTransformOptions = options.classToPlainTransformOptions;
    driver.plainToClassTransformOptions = options.plainToClassTransformOptions;

    if (options.errorOverridingMap !== undefined)
        driver.errorOverridingMap = options.errorOverridingMap;

    if (options.routePrefix !== undefined)
        driver.routePrefix = options.routePrefix;

    if (options.currentUserChecker !== undefined)
        driver.currentUserChecker = options.currentUserChecker;

    if (options.authorizationChecker !== undefined)
        driver.authorizationChecker = options.authorizationChecker;

    driver.cors = options.cors;

    new Mink(driver, options)
        .initialize()
        .registerInterceptors(interceptorClasses)
        .registerMiddlewares("before", middlewareClasses)
        .registerControllers(controllerClasses)
        .registerMiddlewares("after", middlewareClasses);
}

export function createParamDecorator(options: CustomParameterDecorator) {
    return function(object: Object, method: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "custom-converter",
            object: object,
            method: method,
            index: index,
            parse: false,
            required: options.required,
            transform: options.value
        });
    };
}