import {Action} from "./Action";
import {ActionMetadata} from "./metadata/ActionMetadata";
import {ActionParameterHandler} from "./ActionParameterHandler";
import {BaseDriver} from "./driver/BaseDriver";
import {InterceptorInterface} from "./InterceptorInterface";
import {InterceptorMetadata} from "./metadata/InterceptorMetadata";
import {MetadataBuilder} from "./metadata-builder/MetadataBuilder";
import {MinkOptions} from "./MinkOptions";
import {getFromContainer} from "./container";
import {isPromiseLike} from "./util/isPromiseLike";
import {runInSequence} from "./util/runInSequence";

export class Mink<T extends BaseDriver> {
    private parameterHandler: ActionParameterHandler<T>;
    private metadataBuilder: MetadataBuilder;
    private interceptors: InterceptorMetadata[] = [];

    constructor(private driver: T, private options: MinkOptions) {
        this.parameterHandler = new ActionParameterHandler(driver);
        this.metadataBuilder = new MetadataBuilder(options);
    }

    initialize(): this {
        this.driver.initialize();
        return this;
    }

    registerInterceptors(classes?: Function[]): this {
        const interceptors = this.metadataBuilder
            .buildInterceptorMetadata(classes)
            .sort((middleware1, middleware2) => middleware1.priority - middleware2.priority)
            .reverse();
        this.interceptors.push(...interceptors);
        return this;
    }

    registerControllers(classes?: Function[]): this {
        const controllers = this.metadataBuilder.buildControllerMetadata(classes);
        controllers.forEach(controller => {
            controller.actions.forEach(actionMetadata => {
                const interceptorFns = this.prepareInterceptors([
                    ...this.interceptors,
                    ...actionMetadata.controllerMetadata.interceptors,
                    ...actionMetadata.interceptors
                ]);
                this.driver.registerAction(actionMetadata, (action: Action) => {
                    return this.executeAction(actionMetadata, action, interceptorFns);
                });
            });
        });
        this.driver.registerRoutes();
        return this;
    }

    registerMiddlewares(type: "before"|"after", classes?: Function[]): this {
        this.metadataBuilder
            .buildMiddlewareMetadata(classes)
            .filter(middleware => middleware.global && middleware.type === type)
            .sort((middleware1, middleware2) => middleware2.priority - middleware1.priority)
            .forEach(middleware => this.driver.registerMiddleware(middleware));

        return this;
    }

    protected executeAction(actionMetadata: ActionMetadata, action: Action, interceptorFns: Function[]) {
        const paramsPromises = actionMetadata.params
            .sort((param1, param2) => param1.index - param2.index)
            .map(param => this.parameterHandler.handle(action, param));

        return Promise.all(paramsPromises).then(params => {
            const allParams = actionMetadata.appendParams ? actionMetadata.appendParams(action).concat(params) : params;
            const result = actionMetadata.methodOverride ? actionMetadata.methodOverride(actionMetadata, action, allParams) : actionMetadata.callMethod(allParams);
            return this.handleCallMethodResult(result, actionMetadata, action, interceptorFns);

        }).catch(error => {
            return this.driver.handleError(error, actionMetadata, action);
        });
    }

    protected handleCallMethodResult(result: any, action: ActionMetadata, options: Action, interceptorFns: Function[]): any {
        if (isPromiseLike(result)) {
            return result
                .then((data: any) => {
                    return this.handleCallMethodResult(data, action, options, interceptorFns);
                })
                .catch((error: any) => {
                    return this.driver.handleError(error, action, options);
                });
        } else {

            if (interceptorFns) {
                const awaitPromise = runInSequence(interceptorFns, interceptorFn => {
                    const interceptedResult = interceptorFn(options, result);
                    if (isPromiseLike(interceptedResult)) {
                        return interceptedResult.then((resultFromPromise: any) => {
                            result = resultFromPromise;
                        });
                    } else {
                        result = interceptedResult;
                        return Promise.resolve();
                    }
                });

                return awaitPromise
                    .then(() => this.driver.handleSuccess(result, action, options))
                    .catch(error => this.driver.handleError(error, action, options));
            } else {
                return this.driver.handleSuccess(result, action, options);
            }
        }
    }
    
    protected prepareInterceptors(uses: InterceptorMetadata[]): Function[] {
        return uses.map(use => {
            if (use.interceptor.prototype && use.interceptor.prototype.intercept) {
                return function (action: Action, result: any) {
                    return (getFromContainer(use.interceptor) as InterceptorInterface).intercept(action, result);
                };
            }
            return use.interceptor;
        });
    }

}
