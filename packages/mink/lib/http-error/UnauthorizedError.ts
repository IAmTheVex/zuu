import {HttpError} from "./HttpError";

export class UnauthorizedError extends HttpError {
    name = "UnauthorizedError";

    constructor(message?: string) {
        super(401);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);

        if (message)
            this.message = message;
    }

}