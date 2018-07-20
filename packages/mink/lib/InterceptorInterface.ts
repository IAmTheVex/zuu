import {Action} from "./Action";

export interface InterceptorInterface {
    intercept(action: Action, result: any): any|Promise<any>;

}