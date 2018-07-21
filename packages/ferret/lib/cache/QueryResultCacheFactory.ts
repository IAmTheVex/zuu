import {RedisQueryResultCache} from "./RedisQueryResultCache";
import {DbQueryResultCache} from "./DbQueryResultCache";
import {QueryResultCache} from "./QueryResultCache";
import {Connection} from "../connection/Connection";

export class QueryResultCacheFactory {

    constructor(protected connection: Connection) {
    }
    
    create(): QueryResultCache {
        if (!this.connection.options.cache)
            throw new Error(`To use cache you need to enable it in connection options by setting cache: true or providing some caching options. Example: { host: ..., username: ..., cache: true }`);

        if ((this.connection.options.cache as any).type === "redis")
            return new RedisQueryResultCache(this.connection);

        return new DbQueryResultCache(this.connection);
    }
}