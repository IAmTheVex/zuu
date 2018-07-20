import {BadRequestError} from "../http-error/BadRequestError";

export class ParameterParseJsonError extends BadRequestError {
    name = "ParameterParseJsonError";

    constructor(parameterName: string, value: any) {
        super(`Given parameter ${parameterName} is invalid. Value (${JSON.stringify(value)}) cannot be parsed into JSON.`);
        Object.setPrototypeOf(this, ParameterParseJsonError.prototype);
    }

}