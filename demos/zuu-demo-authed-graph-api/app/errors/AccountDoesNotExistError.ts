import { BadRequestError } from "@zuu/mink";

export class AccountDoesNotExistError extends BadRequestError {
    constructor(identity: string) {
        super("An account identified by \"" + identity + "\" does not exist.");
        this.name = "AccountDoesNotExistError";
    }
}