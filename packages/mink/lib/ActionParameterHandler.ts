import {plainToClass} from "class-transformer";
import {validateOrReject as validate, ValidationError} from "class-validator";
import {Action} from "./Action";
import {BadRequestError} from "./http-error/BadRequestError";
import {BaseDriver} from "./driver/BaseDriver";
import {ParameterParseJsonError} from "./error/ParameterParseJsonError";
import {ParamMetadata} from "./metadata/ParamMetadata";
import {ParamRequiredError} from "./error/ParamRequiredError";
import {AuthorizationRequiredError} from "./error/AuthorizationRequiredError";
import {CurrentUserCheckerNotDefinedError} from "./error/CurrentUserCheckerNotDefinedError";
import {isPromiseLike} from "./util/isPromiseLike";

export class ActionParameterHandler<T extends BaseDriver> {
    constructor(private driver: T) {
    }

    handle(action: Action, param: ParamMetadata): Promise<any>|any {

        if (param.type === "request")
            return action.request;

        if (param.type === "response")
            return action.response;

        if (param.type === "context")
            return action.context;

        const value = this.normalizeParamValue(this.driver.getParamFromRequest(action, param), param);
        if (isPromiseLike(value))
            return value.then(value => this.handleValue(value, action, param));

        return this.handleValue(value, action, param);
    }

    protected handleValue(value: any, action: Action, param: ParamMetadata): Promise<any>|any {
        if (param.transform)
            value = param.transform(action, value);

        if (param.type === "current-user") {
            if (!this.driver.currentUserChecker)
                throw new CurrentUserCheckerNotDefinedError();

            value = this.driver.currentUserChecker(action);
        }

        if (param.required) {
            const isValueEmpty = value === null || value === undefined || value === "";
            const isValueEmptyObject = value instanceof Object && Object.keys(value).length === 0;

            if (param.type === "body" && !param.name && (isValueEmpty || isValueEmptyObject)) {
                return Promise.reject(new ParamRequiredError(action, param));

            } else if (param.type === "current-user") {

                if (isPromiseLike(value)) {
                    return value.then(currentUser => {
                        if (!currentUser)
                            return Promise.reject(new AuthorizationRequiredError(action));

                        return currentUser;
                    });

                } else {
                    if (!value)
                        return Promise.reject(new AuthorizationRequiredError(action));
                }

            } else if (param.name && isValueEmpty) {
                return Promise.reject(new ParamRequiredError(action, param));
            }
        }

        return value;
    }

    protected normalizeParamValue(value: any, param: ParamMetadata): Promise<any>|any {
        if (value === null || value === undefined)
            return value;

        switch (param.targetName) {
            case "number":
                if (value === "") return undefined;
                return +value;

            case "string":
                return value;

            case "boolean":
                if (value === "true" || value === "1") {
                    return true;

                } else if (value === "false" || value === "0") {
                    return false;
                }

                return !!value;

            case "date":
                const parsedDate = new Date(value);
                if (isNaN(parsedDate.getTime())) {
                    return Promise.reject(new BadRequestError(`${param.name} is invalid! It can't be parsed to date.`));
                }
                return parsedDate;

            default:
                if (value && (param.parse || param.isTargetObject)) {
                    value = this.parseValue(value, param);
                    value = this.transformValue(value, param);
                    value = this.validateValue(value, param);
                }
        }
        return value;
    }

    protected parseValue(value: any, paramMetadata: ParamMetadata): any {
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            } catch (error) {
                throw new ParameterParseJsonError(paramMetadata.name, value);
            }
        }

        return value;
    }

    protected transformValue(value: any, paramMetadata: ParamMetadata): any {
        if (this.driver.useClassTransformer &&
            paramMetadata.targetType &&
            paramMetadata.targetType !== Object &&
            !(value instanceof paramMetadata.targetType)) {

            const options = paramMetadata.classTransform || this.driver.plainToClassTransformOptions;
            value = plainToClass(paramMetadata.targetType, value, options);
        }

        return value;
    }

    protected validateValue(value: any, paramMetadata: ParamMetadata): Promise<any>|any {
        const isValidationEnabled = (paramMetadata.validate instanceof Object || paramMetadata.validate === true)
            || (this.driver.enableValidation === true && paramMetadata.validate !== false);
        const shouldValidate = paramMetadata.targetType
            && (paramMetadata.targetType !== Object)
            && (value instanceof paramMetadata.targetType);

        if (isValidationEnabled && shouldValidate) {
            const options = paramMetadata.validate instanceof Object ? paramMetadata.validate : this.driver.validationOptions;
            return validate(value, options)
                .then(() => value)
                .catch((validationErrors: ValidationError[]) => {
                    const error: any = new BadRequestError(`Invalid ${paramMetadata.type}, check 'errors' property for more info.`);
                    error.errors = validationErrors;
                    error.paramName = paramMetadata.name; 
                    throw error;
                });
        }

        return value;
    }

}
