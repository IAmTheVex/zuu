import {ConnectionOptions} from "../ConnectionOptions";
import {PlatformTools} from "../../platform/PlatformTools";
import {OrmUtils} from "../../util/OrmUtils";

export class ConnectionOptionsEnvReader {

    read(): ConnectionOptions {
        return {
            type: PlatformTools.getEnvVariable("FERRET_CONNECTION"),
            url: PlatformTools.getEnvVariable("FERRET_URL"),
            host: PlatformTools.getEnvVariable("FERRET_HOST"),
            port: PlatformTools.getEnvVariable("FERRET_PORT"),
            username: PlatformTools.getEnvVariable("FERRET_USERNAME"),
            password: PlatformTools.getEnvVariable("FERRET_PASSWORD"),
            database: PlatformTools.getEnvVariable("FERRET_DATABASE"),
            sid: PlatformTools.getEnvVariable("FERRET_SID"),
            schema: PlatformTools.getEnvVariable("FERRET_SCHEMA"),
            extra: PlatformTools.getEnvVariable("FERRET_DRIVER_EXTRA") ? JSON.parse(PlatformTools.getEnvVariable("FERRET_DRIVER_EXTRA")) : undefined,
            synchronize: OrmUtils.toBoolean(PlatformTools.getEnvVariable("FERRET_SYNCHRONIZE")),
            dropSchema: OrmUtils.toBoolean(PlatformTools.getEnvVariable("FERRET_DROP_SCHEMA")),
            migrationsRun: OrmUtils.toBoolean(PlatformTools.getEnvVariable("FERRET_MIGRATIONS_RUN")),
            entities: this.stringToArray(PlatformTools.getEnvVariable("FERRET_ENTITIES")),
            migrations: this.stringToArray(PlatformTools.getEnvVariable("FERRET_MIGRATIONS")),
            subscribers: this.stringToArray(PlatformTools.getEnvVariable("FERRET_SUBSCRIBERS")),
            logging: this.transformLogging(PlatformTools.getEnvVariable("FERRET_LOGGING")),
            logger: PlatformTools.getEnvVariable("FERRET_LOGGER"),
            entityPrefix: PlatformTools.getEnvVariable("FERRET_ENTITY_PREFIX"),
            maxQueryExecutionTime: PlatformTools.getEnvVariable("FERRET_MAX_QUERY_EXECUTION_TIME"),
            cli: {
                entitiesDir: PlatformTools.getEnvVariable("FERRET_ENTITIES_DIR"),
                migrationsDir: PlatformTools.getEnvVariable("FERRET_MIGRATIONS_DIR"),
                subscribersDir: PlatformTools.getEnvVariable("FERRET_SUBSCRIBERS_DIR"),
            }
        };
    }

    protected transformLogging(logging: string): any {
        if (logging === "true" || logging === "TRUE" || logging === "1")
            return true;
        if (logging === "all")
            return "all";

        return this.stringToArray(logging);
    }

    protected stringToArray(variable?: string) {
        if (!variable)
            return [];
        return variable.split(",").map(str => str.trim());
    }

}
