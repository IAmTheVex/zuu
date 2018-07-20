import {ResponseHandlerType} from "../types/ResponseHandlerType";

export interface ResponseHandlerMetadataArgs {
    target: Function;
    method: string;
    type: ResponseHandlerType;
    value?: any;
    secondaryValue?: any;
    
}