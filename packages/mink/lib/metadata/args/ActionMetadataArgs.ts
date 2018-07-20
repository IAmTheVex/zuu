import {ActionType} from "../types/ActionType";
import {Action} from "../../Action";
import {ActionMetadata} from "../ActionMetadata";

export interface ActionMetadataArgs {
    route: string|RegExp;
    target: Function;
    method: string;
    type: ActionType;

    appendParams?: (action: Action) => any[];
    methodOverride?: (actionMetadata: ActionMetadata, action: Action, params: any[]) => Promise<any>|any;
    
}