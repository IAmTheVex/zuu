import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";
import {ReadPreference} from "./typings";

export interface MongoConnectionOptions extends BaseConnectionOptions {

    readonly type: "mongodb";

    readonly url?: string;

    readonly host?: string;

    readonly port?: number;

    readonly username?: string;
    
    readonly password?: string;

    readonly database?: string;

    readonly poolSize?: number;

    readonly ssl?: boolean;

    readonly sslValidate?: boolean;

    readonly sslCA?: string[]|Buffer[];

    readonly sslCert?: string|Buffer;

    readonly sslKey?: string|Buffer;

    readonly sslPass?: string|Buffer;

    readonly autoReconnect?: boolean;

    readonly noDelay?: boolean;

    readonly keepAlive?: number;

    readonly connectTimeoutMS?: number;

    readonly socketTimeoutMS?: number;

    readonly reconnectTries?: number;

    readonly reconnectInterval?: number;

    readonly ha?: boolean;

    readonly haInterval?: number;

    readonly replicaSet?: string;

    readonly acceptableLatencyMS?: number;

    readonly secondaryAcceptableLatencyMS?: number;

    readonly connectWithNoPrimary?: boolean;

    readonly authSource?: string;

    readonly w?: string|number;

    readonly wtimeout?: number;

    readonly j?: boolean;

    readonly forceServerObjectId?: boolean;

    readonly serializeFunctions?: boolean;

    readonly ignoreUndefined?: boolean;

    readonly raw?: boolean;

    readonly promoteLongs?: boolean;

    readonly promoteBuffers?: boolean;

    readonly promoteValues?: boolean;

    readonly domainsEnabled?: boolean;

    readonly bufferMaxEntries?: boolean;

    readonly readPreference?: ReadPreference;

    readonly pkFactory?: any;

    readonly promiseLibrary?: any;

    readonly readConcern?: any;

    readonly maxStalenessSeconds?: number;

    readonly loggerLevel?: "error"|"warn"|"info"|"debug";

    readonly authMechanism?: string;
}