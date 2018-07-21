import { BadRequestError } from "@zuu/mink";

export class RequiredResourceNotProvidedError extends BadRequestError {
    constructor(resourceType: string) {
        super(`<${resourceType}> should be provided via <x-resource-${resourceType}> header!`);
        this.name = "RequiredResourceNotProvidedError";
    }
}