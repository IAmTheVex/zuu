import {AbstractSqliteDriver} from "../sqlite-abstract/AbstractSqliteDriver";
import {CordovaConnectionOptions} from "./CordovaConnectionOptions";
import {CordovaQueryRunner} from "./CordovaQueryRunner";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {Connection} from "../../connection/Connection";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";

interface Window {
    sqlitePlugin: any;
}

declare var window: Window;

export class CordovaDriver extends AbstractSqliteDriver {
    options: CordovaConnectionOptions;
    
    constructor(connection: Connection) {
        super(connection);

        this.database = this.options.database;

        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        if (!this.options.location)
            throw new DriverOptionNotSetError("location");

        this.loadDependencies();
    }
    
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.queryRunner = undefined;
            this.databaseConnection.close(ok, fail);
        });
    }
    
    createQueryRunner(mode: "master"|"slave" = "master"): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new CordovaQueryRunner(this);

        return this.queryRunner;
    }
    
    protected createDatabaseConnection() {
        return new Promise<void>((ok, fail) => {
            const options = Object.assign({}, {
                name: this.options.database,
                location: this.options.location,
            }, this.options.extra || {});

            this.sqlite.openDatabase(options, (db: any) => {
                const databaseConnection = db;

                databaseConnection.executeSql(`PRAGMA foreign_keys = ON;`, [], (result: any) => {
                    ok(databaseConnection);
                }, (error: any) => {
                    fail(error);
                });
            }, (error: any) => {
                fail(error);
            });
        });
    }

    protected loadDependencies(): void {
        try {
            this.sqlite = window.sqlitePlugin;

        } catch (e) {
            throw new DriverPackageNotInstalledError("Cordova-SQLite", "cordova-sqlite-storage");
        }
    }
}