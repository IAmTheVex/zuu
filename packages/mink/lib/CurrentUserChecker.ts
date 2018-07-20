import {Action} from "./Action";

export type CurrentUserChecker = (action: Action) => Promise<any>|any;