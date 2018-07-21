import { BadRequestError } from "@zuu/mink";

export class EmailIsNotUniqueError extends BadRequestError {
    constructor(email: string) {
        super("There's already an account registered with \"" + email + "\" email address.");
        this.name = "EmailIsNotUniqueError";
    }
}