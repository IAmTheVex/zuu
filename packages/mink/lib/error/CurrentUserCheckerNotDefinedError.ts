import {InternalServerError} from "../http-error/InternalServerError";

export class CurrentUserCheckerNotDefinedError extends InternalServerError {
    name = "CurrentUserCheckerNotDefinedError";

    constructor() {
        super(`Cannot use @CurrentUser decorator. Please define currentUserChecker function in routing-controllers action before using it.`);
        Object.setPrototypeOf(this, CurrentUserCheckerNotDefinedError.prototype);
    }

}