import { BadRequestError } from "@zuu/mink";

export class InvalidTokenError extends BadRequestError {
    constructor(token: string) {
        super("Access attempt with invalid token\"" + token + "\" will be reported!");
        this.name = "IvalidTokenError";
    }
}