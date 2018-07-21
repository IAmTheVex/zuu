import {QueryResultCache} from "./QueryResultCache";
import {QueryResultCacheOptions} from "./QueryResultCacheOptions";
import {PlatformTools} from "../platform/PlatformTools";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";

export class RedisQueryResultCache implements QueryResultCache {

    protected redis: any;

    protected client: any;

    constructor(protected connection: Connection) {
        this.redis = this.loadRedis();
    }

    async connect(): Promise<void> {
        const cacheOptions: any = this.connection.options.cache;
        if (cacheOptions && cacheOptions.options) {
            this.client = this.redis.createClient(cacheOptions.options);
        } else {
            this.client = this.redis.createClient();
        }
    }

    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.client.quit((err: any, result: any) => {
                if (err) return fail(err);
                ok();
                this.client = undefined;
            });
        });
    }

    async synchronize(queryRunner: QueryRunner): Promise<void> {
    }

    getFromCache(options: QueryResultCacheOptions, queryRunner?: QueryRunner): Promise<QueryResultCacheOptions|undefined> {
        return new Promise<QueryResultCacheOptions|undefined>((ok, fail) => {

            if (options.identifier) {
                this.client.get(options.identifier, (err: any, result: any) => {
                    if (err) return fail(err);
                    ok(JSON.parse(result));
                });

            } else if (options.query) {
                this.client.get(options.query, (err: any, result: any) => {
                    if (err) return fail(err);
                    ok(JSON.parse(result));
                });

            } else {
                ok(undefined);
            }
        });
    }

    isExpired(savedCache: QueryResultCacheOptions): boolean {
        return (savedCache.time! + savedCache.duration) < new Date().getTime();
    }

    async storeInCache(options: QueryResultCacheOptions, savedCache: QueryResultCacheOptions, queryRunner?: QueryRunner): Promise<void> {
        return new Promise<void>((ok, fail) => {
            if (options.identifier) {
                this.client.set(options.identifier, JSON.stringify(options), (err: any, result: any) => {
                    if (err) return fail(err);
                    ok();
                });

            } else if (options.query) {
                this.client.set(options.query, JSON.stringify(options), (err: any, result: any) => {
                    if (err) return fail(err);
                    ok();
                });
            }
        });
    }

    async clear(queryRunner?: QueryRunner): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.client.flushdb((err: any, result: any) => {
                if (err) return fail(err);
                ok();
            });
        });
    }

    async remove(identifiers: string[], queryRunner?: QueryRunner): Promise<void> {
        await Promise.all(identifiers.map(identifier => {
            return this.deleteKey(identifier);
        }));
    }

    protected deleteKey(key: string): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.client.del(key, (err: any, result: any) => {
                if (err) return fail(err);
                ok();
            });
        });
    }

    protected loadRedis(): any {
        try {
            return PlatformTools.load("redis");

        } catch (e) {
            throw new Error(`Cannot use cache because redis is not installed. Please run "npm i redis --save".`);
        }
    }


}