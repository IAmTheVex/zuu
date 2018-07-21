import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

export interface CordovaConnectionOptions extends BaseConnectionOptions {

    readonly type: "cordova";

    readonly database: string;

    readonly location: string;
}