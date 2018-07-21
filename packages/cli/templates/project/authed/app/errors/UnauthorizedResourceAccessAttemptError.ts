import { BadRequestError } from '@zuu/mink';

export class UnauthorizedResourceAccessAttemptError extends BadRequestError {
    public constructor(resourceType: string, id: string) {
        super(`Detected unauthorized resource access attempt on <${resourceType}: ${id}>! This will be reported!`);
        this.name = "UnauthorizedResourceAccessAttemptError";
    }
}