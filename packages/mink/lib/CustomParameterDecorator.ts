import {Action} from "./Action";

export interface CustomParameterDecorator {
    required?: boolean;
    value: (action: Action, value?: any) => Promise<any>|any;

}