import {HttpError} from "./HttpError";

export class ForbiddenError extends HttpError {
    name = "ForbiddenError";

    constructor(message?: string) {
        super(403);
        Object.setPrototypeOf(this, ForbiddenError.prototype);

        if (message)
            this.message = message;
    }

}