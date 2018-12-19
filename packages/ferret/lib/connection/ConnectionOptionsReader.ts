import {ConnectionOptions} from "./ConnectionOptions";
import {PlatformTools} from "../platform/PlatformTools";
import {ConnectionOptionsEnvReader} from "./options-reader/ConnectionOptionsEnvReader";
import {ConnectionOptionsYmlReader} from "./options-reader/ConnectionOptionsYmlReader";
import {ConnectionOptionsXmlReader} from "./options-reader/ConnectionOptionsXmlReader";
import * as path from 'path';

export class ConnectionOptionsReader {

    constructor(protected options?: {

        root?: string,

        configName?: string
    }) {
    }

    async all(): Promise<ConnectionOptions[]> {
        const options = await this.load();
        if (!options)
            throw new Error(`No connection options were found in any of configurations file.`);

        return options;
    }

    async get(name: string): Promise<ConnectionOptions> {
        const allOptions = await this.all();
        const targetOptions = allOptions.find(options => options.name === name || (name === "default" && !options.name));
        if (!targetOptions)
            throw new Error(`Cannot find connection ${name} because its not defined in any orm configuration files.`);

        return targetOptions;
    }

    async has(name: string): Promise<boolean> {
        const allOptions = await this.load();
        if (!allOptions)
            return false;

        const targetOptions = allOptions.find(options => options.name === name || (name === "default" && !options.name));
        return !!targetOptions;
    }

    protected async load(): Promise<ConnectionOptions[]|undefined> {

        // try to find any of following configuration formats
        const foundFileFormat = ["env", "js", "ts", "json", "yml", "yaml", "xml"].find(format => {
            return PlatformTools.fileExist(this.baseFilePath + "." + format);
        });

        // if .env file found then load all its variables into process.env using dotenv package
        if (foundFileFormat === "env") {
            const dotenv = PlatformTools.load("dotenv");
            dotenv.config({ path: this.baseFilePath + ".env" });
        } else if (PlatformTools.fileExist(".env")) {
            const dotenv = PlatformTools.load("dotenv");
            dotenv.config({ path: ".env" });
        }

        // try to find connection options from any of available sources of configuration
        let connectionOptions: ConnectionOptions|ConnectionOptions[]|undefined = undefined;
        if (PlatformTools.getEnvVariable("FERRET_CONNECTION")) {
            connectionOptions = new ConnectionOptionsEnvReader().read();

        } else if (foundFileFormat === "js") {
            connectionOptions = PlatformTools.load(this.baseFilePath + ".js");

        } else if (foundFileFormat === "ts") {
            connectionOptions = PlatformTools.load(this.baseFilePath + ".ts");

        } else if (foundFileFormat === "json") {
            connectionOptions = PlatformTools.load(this.baseFilePath + ".json");

        } else if (foundFileFormat === "yml") {
            connectionOptions = new ConnectionOptionsYmlReader().read(this.baseFilePath + ".yml");

        } else if (foundFileFormat === "yaml") {
            connectionOptions = new ConnectionOptionsYmlReader().read(this.baseFilePath + ".yaml");

        } else if (foundFileFormat === "xml") {
            connectionOptions = await new ConnectionOptionsXmlReader().read(this.baseFilePath + ".xml");
        }

        // normalize and return connection options
        if (connectionOptions) {
            return this.normalizeConnectionOptions(connectionOptions);
        }

        return undefined;
    }

    protected normalizeConnectionOptions(connectionOptions: ConnectionOptions|ConnectionOptions[]): ConnectionOptions[] {
        if (!(connectionOptions instanceof Array))
            connectionOptions = [connectionOptions];

        connectionOptions.forEach(options => {

            if (options.entities) {
                const entities = (options.entities as any[]).map(entity => {
                    if (typeof entity === "string" && entity.substr(0, 1) !== "/")
                        return this.baseFilePath + "/" + entity;

                    return entity;
                });
                Object.assign(connectionOptions, { entities: entities });
            }
            if (options.subscribers) {
                const subscribers = (options.subscribers as any[]).map(subscriber => {
                    if (typeof subscriber === "string" && subscriber.substr(0, 1) !== "/")
                        return this.baseFilePath + "/" + subscriber;

                    return subscriber;
                });
                Object.assign(connectionOptions, { subscribers: subscribers });
            }
            if (options.migrations) {
                const migrations = (options.migrations as any[]).map(migration => {
                    if (typeof migration === "string" && migration.substr(0, 1) !== "/")
                        return this.baseFilePath + "/" + migration;

                    return migration;
                });
                Object.assign(connectionOptions, { migrations: migrations });
            }

            // make database path file in sqlite relative to package.json
            if (options.type === "sqlite") {
                if (typeof options.database === "string" &&
                    options.database.substr(0, 1) !== "/" &&  // unix absolute
                    options.database.substr(1, 2) !== ":\\" && // windows absolute
                    options.database !== ":memory:") {
                    Object.assign(options, {
                        database: this.baseDirectory + "/" + options.database
                    });
                }
            }
        });

        return connectionOptions;
    }

    protected get baseFilePath(): string {
        return this.baseDirectory + "/" + this.baseConfigName;
    }

    protected get baseDirectory(): string {
        if (this.options && this.options.root)
            return path.join(this.options.root, '.config');

        return path.join(PlatformTools.load("app-root-path").path, '.config');
    }

    protected get baseConfigName(): string {
        if (this.options && this.options.configName)
            return this.options.configName;

        return "ferret.config";
    }

}
