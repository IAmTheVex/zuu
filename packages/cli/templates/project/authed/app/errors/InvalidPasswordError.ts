import { BadRequestError } from "@zuu/mink";

export class InvalidPasswordError extends BadRequestError {   
    constructor(identifier: string) {
        super("Login attempt with invalid credentials for account identified with \"" + identifier + "\" will be reported!");
        this.name = "InavlidPasswordError";
    }
}