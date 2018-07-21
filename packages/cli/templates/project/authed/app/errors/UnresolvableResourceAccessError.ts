import {  BadRequestError } from '@zuu/mink';

export class UnresolvableResourceAccessError extends BadRequestError {
    public constructor(resourceType: string, id: string) {
        super(`Unresolvable resource access on <${resourceType}: ${id}>! This will be reported!`);
        this.name = "UnresolvableResourceAccessError";
    }
}