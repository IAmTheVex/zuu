import {AbstractSqliteDriver} from "../sqlite-abstract/AbstractSqliteDriver";
import {SqljsConnectionOptions} from "./SqljsConnectionOptions";
import {SqljsQueryRunner} from "./SqljsQueryRunner";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {Connection} from "../../connection/Connection";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {PlatformTools} from "../../platform/PlatformTools";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";
import {ObjectLiteral} from "../../common/ObjectLiteral";

interface Window {
    SQL: any;
}
declare var window: Window;

export class SqljsDriver extends AbstractSqliteDriver {
    options: SqljsConnectionOptions;

    constructor(connection: Connection) {
        super(connection);

        if (this.options.autoSave && !this.options.location && !this.options.autoSaveCallback) {
            throw new DriverOptionNotSetError(`location or autoSaveCallback`);
        }

        this.loadDependencies();
    }


    async connect(): Promise<void> {
        this.databaseConnection = await this.createDatabaseConnection();
    }

    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            try {
                this.queryRunner = undefined;
                this.databaseConnection.close();
                ok();
            }
            catch (e)  {
                fail(e);
            }
        });
    }

    createQueryRunner(mode: "master" | "slave" = "master"): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new SqljsQueryRunner(this);

        return this.queryRunner;
    }
    
    load(fileNameOrLocalStorageOrData: string | Uint8Array, checkIfFileOrLocalStorageExists: boolean = true): Promise<any> {
        if (typeof fileNameOrLocalStorageOrData === "string") {
            if (PlatformTools.type === "node") {
                if (PlatformTools.fileExist(fileNameOrLocalStorageOrData)) {
                    const database = PlatformTools.readFileSync(fileNameOrLocalStorageOrData);
                    return this.createDatabaseConnectionWithImport(database);
                }
                else if (checkIfFileOrLocalStorageExists) {
                    throw new Error(`File ${fileNameOrLocalStorageOrData} does not exist`);
                }
                else {
                    return this.createDatabaseConnectionWithImport();
                }
            } 
            else {
                const localStorageContent = PlatformTools.getGlobalVariable().localStorage.getItem(fileNameOrLocalStorageOrData);
                
                if (localStorageContent != null) {
                    return this.createDatabaseConnectionWithImport(JSON.parse(localStorageContent));
                }
                else if (checkIfFileOrLocalStorageExists) {
                    throw new Error(`File ${fileNameOrLocalStorageOrData} does not exist`);
                }
                else {
                    return this.createDatabaseConnectionWithImport();
                }
            }
        }
        else {
            return this.createDatabaseConnectionWithImport(fileNameOrLocalStorageOrData);
        }
    }

    async save(location?: string) {
        if (!location && !this.options.location) {
            throw new Error(`No location is set, specify a location parameter or add the location option to your configuration`);
        }
        
        let path = "";
        if (location) {
            path = location;
        }
        else if (this.options.location) {
            path = this.options.location;
        }

        if (PlatformTools.type === "node") {
            try {
                const content = new Buffer(this.databaseConnection.export());
                await PlatformTools.writeFile(path, content);
            }
            catch (e) {
                throw new Error(`Could not save database, error: ${e}`);
            }
        }
        else {
            const database: Uint8Array = this.databaseConnection.export();
            const databaseArray = [].slice.call(database);
            PlatformTools.getGlobalVariable().localStorage.setItem(path, JSON.stringify(databaseArray));
        }
    }

    async autoSave() {
        if (this.options.autoSave) {
            if (this.options.autoSaveCallback) {
                await this.options.autoSaveCallback(this.export());
            }
            else {
                await this.save();
            }
        }
    }
    
    export(): Uint8Array {
        return this.databaseConnection.export();
    }

    createGeneratedMap(metadata: EntityMetadata, insertResult: any) {
        const generatedMap = metadata.generatedColumns.reduce((map, generatedColumn) => {
            if (generatedColumn.isPrimary && generatedColumn.generationStrategy === "increment") {
                const query = "SELECT last_insert_rowid()";
                try {
                    let result = this.databaseConnection.exec(query);
                    this.connection.logger.logQuery(query);
                    return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(result[0].values[0][0]));
                }
                catch (e) {
                    this.connection.logger.logQueryError(e, query, []);
                }
            }

            return map;
        }, {} as ObjectLiteral);

        return Object.keys(generatedMap).length > 0 ? generatedMap : undefined;
    }

    protected createDatabaseConnection(): Promise<any> {
        if (this.options.location) {
            return this.load(this.options.location, false);
        }

        return this.createDatabaseConnectionWithImport(this.options.database);
    }

    protected async createDatabaseConnectionWithImport(database?: Uint8Array): Promise<any> {
        if (database && database.length > 0) {
            this.databaseConnection = new this.sqlite.Database(database);
        }
        else {
            this.databaseConnection = new this.sqlite.Database();
        }

        return new Promise<any>((ok, fail) => {
            try {
                this.databaseConnection.exec(`PRAGMA foreign_keys = ON;`);
                ok(this.databaseConnection);
            }
            catch (e) {
                fail(e);
            }
        });
    }

    protected loadDependencies(): void {
        if (PlatformTools.type === "browser") {
            this.sqlite = window.SQL;
        }
        else {
            try {
                this.sqlite = PlatformTools.load("sql.js");
            } catch (e) {
                throw new DriverPackageNotInstalledError("sql.js", "sql.js");
            }
        }
    }
}