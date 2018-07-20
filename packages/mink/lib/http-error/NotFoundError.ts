import {HttpError} from "./HttpError";

export class NotFoundError extends HttpError {
    name = "NotFoundError";

    constructor(message?: string) {
        super(404);
        Object.setPrototypeOf(this, NotFoundError.prototype);

        if (message)
            this.message = message;
    }

}