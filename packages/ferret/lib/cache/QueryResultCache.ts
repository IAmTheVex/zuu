import {QueryResultCacheOptions} from "./QueryResultCacheOptions";
import {QueryRunner} from "../query-runner/QueryRunner";

export interface QueryResultCache {

    connect(): Promise<void>;

    disconnect(): Promise<void>;

    synchronize(queryRunner?: QueryRunner): Promise<void>;

    getFromCache(options: QueryResultCacheOptions, queryRunner?: QueryRunner): Promise<QueryResultCacheOptions|undefined>;

    storeInCache(options: QueryResultCacheOptions, savedCache: QueryResultCacheOptions|undefined, queryRunner?: QueryRunner): Promise<void>;

    isExpired(savedCache: QueryResultCacheOptions): boolean;

    clear(queryRunner?: QueryRunner): Promise<void>;

    remove(identifiers: string[], queryRunner?: QueryRunner): Promise<void>;
}