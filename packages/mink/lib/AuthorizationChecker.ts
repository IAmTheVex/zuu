import {Action} from "./Action";

export type AuthorizationChecker = (action: Action, roles: any[]) => Promise<boolean>|boolean;