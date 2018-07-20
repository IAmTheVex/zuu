import {UseMetadata} from "../../metadata/UseMetadata";
import {MiddlewareMetadata} from "../../metadata/MiddlewareMetadata";
import {ActionMetadata} from "../../metadata/ActionMetadata";
import {Action} from "../../Action";
import {ParamMetadata} from "../../metadata/ParamMetadata";
import {BaseDriver} from "../BaseDriver";
import {ExpressMiddlewareInterface} from "./ExpressMiddlewareInterface";
import {ExpressErrorMiddlewareInterface} from "./ExpressErrorMiddlewareInterface";
import {AccessDeniedError} from "../../error/AccessDeniedError";
import {AuthorizationCheckerNotDefinedError} from "../../error/AuthorizationCheckerNotDefinedError";
import {isPromiseLike} from "../../util/isPromiseLike";
import {getFromContainer} from "../../container";
import {AuthorizationRequiredError} from "../../error/AuthorizationRequiredError";
import {NotFoundError} from "../../index";

const cookie = require("cookie");
const templateUrl = require("template-url");

export class ExpressDriver extends BaseDriver {
    constructor(public express?: any) {
        super();
        this.loadExpress();
        this.app = this.express;
    }

    initialize() {
        if (this.cors) {
            const cors = require("cors");
            if (this.cors === true) {
                this.express.use(cors());
            } else {
                this.express.use(cors(this.cors));
            }
        }
    }

    registerMiddleware(middleware: MiddlewareMetadata): void {
        if ((middleware.instance as ExpressErrorMiddlewareInterface).error) {
            this.express.use(function (error: any, request: any, response: any, next: (err?: any) => any) {
                (middleware.instance as ExpressErrorMiddlewareInterface).error(error, request, response, next);
            });
            return;
        }

        if ((middleware.instance as ExpressMiddlewareInterface).use) {
            this.express.use((request: any, response: any, next: (err: any) => any) => {
                try {
                    const useResult = (middleware.instance as ExpressMiddlewareInterface).use(request, response, next);
                    if (isPromiseLike(useResult)) {
                        useResult.catch((error: any) => {
                            this.handleError(error, undefined, {request, response, next});
                            return error;
                        });
                    }

                } catch (error) {
                    this.handleError(error, undefined, {request, response, next});
                }
            });
        }
    }

    registerAction(actionMetadata: ActionMetadata, executeCallback: (options: Action) => any): void {
        const defaultMiddlewares: any[] = [];

        if (actionMetadata.isBodyUsed) {
            if (actionMetadata.isJsonTyped) {
                defaultMiddlewares.push(this.loadBodyParser().json(actionMetadata.bodyExtraOptions));
            } else {
                defaultMiddlewares.push(this.loadBodyParser().text(actionMetadata.bodyExtraOptions));
            }
        }

        if (actionMetadata.isAuthorizedUsed) {
            defaultMiddlewares.push((request: any, response: any, next: Function) => {
                if (!this.authorizationChecker)
                    throw new AuthorizationCheckerNotDefinedError();

                const action: Action = { request, response, next };
                try {
                    const checkResult = this.authorizationChecker(action, actionMetadata.authorizedRoles);

                    const handleError = (result: any) => {
                        if (!result) {
                            let error = actionMetadata.authorizedRoles.length === 0 ? new AuthorizationRequiredError(action) : new AccessDeniedError(action);
                            this.handleError(error, actionMetadata, action);
                        } else {
                            next();
                        }
                    };

                    if (isPromiseLike(checkResult)) {
                        checkResult
                            .then(result => handleError(result))
                            .catch(error => this.handleError(error, actionMetadata, action));
                    } else {
                        handleError(checkResult);
                    }
                } catch (error) {
                    this.handleError(error, actionMetadata, action);
                }
            });
        }

        if (actionMetadata.isFileUsed || actionMetadata.isFilesUsed) {
            const multer = this.loadMulter();
            actionMetadata.params
                .filter(param => param.type === "file")
                .forEach(param => {
                    defaultMiddlewares.push(multer(param.extraOptions).single(param.name));
                });
            actionMetadata.params
                .filter(param => param.type === "files")
                .forEach(param => {
                    defaultMiddlewares.push(multer(param.extraOptions).array(param.name));
                });
        }

        const uses = [...actionMetadata.controllerMetadata.uses, ...actionMetadata.uses];
        const beforeMiddlewares = this.prepareMiddlewares(uses.filter(use => !use.afterAction));
        const afterMiddlewares = this.prepareMiddlewares(uses.filter(use => use.afterAction));

        const route = ActionMetadata.appendBaseRoute(this.routePrefix, actionMetadata.fullRoute);
        const routeHandler = function routeHandler(request: any, response: any, next: Function) {
            if (request.method.toLowerCase() !== actionMetadata.type)
                return next();

            return executeCallback({request, response, next});
        };

        this.express[actionMetadata.type.toLowerCase()](...[
            route,
            ...beforeMiddlewares,
            ...defaultMiddlewares,
            routeHandler,
            ...afterMiddlewares
        ]);
    }

    registerRoutes() {
    }

    getParamFromRequest(action: Action, param: ParamMetadata): any {
        const request: any = action.request;
        switch (param.type) {
            case "body":
                return request.body;

            case "body-param":
                return request.body[param.name];

            case "param":
                return request.params[param.name];

            case "params":
                return request.params;

            case "session":
                if (param.name)
                    return request.session[param.name];

                return request.session;

            case "state":
                throw new Error("@State decorators are not supported by express driver.");

            case "query":
                return request.query[param.name];

            case "queries":
                return request.query;

            case "header":
                return request.headers[param.name.toLowerCase()];

            case "headers":
                return request.headers;

            case "file":
                return request.file;

            case "files":
                return request.files;

            case "cookie":
                if (!request.headers.cookie) return;
                const cookies = cookie.parse(request.headers.cookie);
                return cookies[param.name];

            case "cookies":
                if (!request.headers.cookie) return {};
                return cookie.parse(request.headers.cookie);
        }
    }

    handleSuccess(result: any, action: ActionMetadata, options: Action): void {
        if (result && result === options.response) {
            options.next();
            return;
        }

        result = this.transformResult(result, action, options);

        if (result === undefined && action.undefinedResultCode) {
            if (action.undefinedResultCode instanceof Function) {
                throw new (action.undefinedResultCode as any)(options);
            }
            options.response.status(action.undefinedResultCode);
        }
        else if (result === null) {
            if (action.nullResultCode) {
                if (action.nullResultCode instanceof Function) {
                    throw new (action.nullResultCode as any)(options);
                }
                options.response.status(action.nullResultCode);
            } else {
                options.response.status(204);
            }
        }
        else if (action.successHttpCode) {
            options.response.status(action.successHttpCode);
        }

        Object.keys(action.headers).forEach(name => {
            options.response.header(name, action.headers[name]);
        });

        if (action.redirect) {
            if (typeof result === "string") {
                options.response.redirect(result);
            } else if (result instanceof Object) {
                options.response.redirect(templateUrl(action.redirect, result));
            } else {
                options.response.redirect(action.redirect);
            }

            options.next();
        }
        else if (action.renderedTemplate) {
            const renderOptions = result && result instanceof Object ? result : {};

            options.response.render(action.renderedTemplate, renderOptions, (err: any, html: string) => {
                if (err && action.isJsonTyped) {
                    return options.next(err);

                } else if (err && !action.isJsonTyped) {
                    return options.next(err);

                } else if (html) {
                    options.response.send(html);
                }
                options.next();
            });
        }
        else if (result === undefined) {

            if (action.undefinedResultCode) {
                if (action.isJsonTyped) {
                    options.response.json();
                } else {
                    options.response.send();
                }
                options.next();

            } else {
                throw new NotFoundError();
            }
        }
        else if (result === null) {
            if (action.isJsonTyped) {
                options.response.json(null);
            } else {
                options.response.send(null);
            }
            options.next();
        }
        else if (result instanceof Buffer) {
            options.response.end(result, "binary");
        }
        else if (result instanceof Uint8Array) {
            options.response.end(Buffer.from(result as any), "binary");
        }
        else if (result.pipe instanceof Function) {
            result.pipe(options.response);
        }
        else {
            if (action.isJsonTyped) {
                options.response.json(result);
            } else {
                options.response.send(result);
            }
            options.next();
        }
    }

    handleError(error: any, action: ActionMetadata | undefined, options: Action): any {
        if (this.isDefaultErrorHandlingEnabled) {
            const response: any = options.response;

            if (error.httpCode) {
                response.status(error.httpCode);
            } else {
                response.status(500);
            }

            if (action) {
                Object.keys(action.headers).forEach(name => {
                    response.header(name, action.headers[name]);
                });
            }

            if (action && action.isJsonTyped) {
                response.json(this.processJsonError(error));
            } else {
                response.send(this.processTextError(error));
            }
        }
        options.next(error);
    }

    protected prepareMiddlewares(uses: UseMetadata[]) {
        const middlewareFunctions: Function[] = [];
        uses.forEach(use => {
            if (use.middleware.prototype && use.middleware.prototype.use) {
                middlewareFunctions.push((request: any, response: any, next: (err: any) => any) => {
                    try {
                        const useResult = (getFromContainer(use.middleware) as ExpressMiddlewareInterface).use(request, response, next);
                        if (isPromiseLike(useResult)) {
                            useResult.catch((error: any) => {
                                this.handleError(error, undefined, {request, response, next});
                                return error;
                            });
                        }

                        return useResult;
                    } catch (error) {
                        this.handleError(error, undefined, {request, response, next});
                    }
                });

            } else if (use.middleware.prototype && use.middleware.prototype.error) {
                middlewareFunctions.push(function (error: any, request: any, response: any, next: (err: any) => any) {
                    return (getFromContainer(use.middleware) as ExpressErrorMiddlewareInterface).error(error, request, response, next);
                });

            } else {
                middlewareFunctions.push(use.middleware);
            }
        });
        return middlewareFunctions;
    }

    protected loadExpress() {
        if (require) {
            if (!this.express) {
                try {
                    this.express = require("express")();
                } catch (e) {
                    throw new Error("express package was not found installed. Try to install it: npm install express --save");
                }
            }
        } else {
            throw new Error("Cannot load express. Try to install all required dependencies.");
        }
    }

    protected loadBodyParser() {
        try {
            return require("body-parser");
        } catch (e) {
            throw new Error("body-parser package was not found installed. Try to install it: npm install body-parser --save");
        }
    }

    protected loadMulter() {
        try {
            return require("multer");
        } catch (e) {
            throw new Error("multer package was not found installed. Try to install it: npm install multer --save");
        }
    }
}
