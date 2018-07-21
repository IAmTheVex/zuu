import { BadRequestError } from "@zuu/mink";

export class ClientDoesNotExistError extends BadRequestError {
    constructor(identity: string) {
        super("A client identified by \"" + identity + "\" does not exist.");
        this.name = "ClientDoesNotExistError";
    }
}