import {EntitySchema} from "../entity-schema/EntitySchema";
import {LoggerOptions} from "../logger/LoggerOptions";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {DatabaseType} from "../driver/types/DatabaseType";
import {Logger} from "../logger/Logger";

export interface BaseConnectionOptions {

    readonly type: DatabaseType;

    readonly name?: string;

    readonly entities?: ((Function|string|EntitySchema<any>))[];

    readonly subscribers?: (Function|string)[];

    readonly migrations?: (Function|string)[];

    readonly migrationsTableName?: string;

    readonly namingStrategy?: NamingStrategyInterface;

    readonly logging?: LoggerOptions;

    readonly logger?: "advanced-console"|"simple-console"|"file"|"debug"|Logger;

    readonly maxQueryExecutionTime?: number;

    readonly synchronize?: boolean;

    readonly migrationsRun?: boolean;

    readonly dropSchema?: boolean;

    readonly entityPrefix?: string;

    readonly extra?: any;

    readonly cache?: boolean|{

        readonly type?: "database"|"redis"; // todo: add mongodb and other cache providers as well in the future

        readonly options?: any;

        readonly alwaysEnabled?: boolean;

        readonly duration?: number;

    };

    readonly cli?: {

        readonly entitiesDir?: string;

        readonly migrationsDir?: string;

        readonly subscribersDir?: string;

    };

}
