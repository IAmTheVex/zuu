import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {SqliteQueryRunner} from "./SqliteQueryRunner";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {SqliteConnectionOptions} from "./SqliteConnectionOptions";
import {ColumnType} from "../types/ColumnTypes";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {AbstractSqliteDriver} from "../sqlite-abstract/AbstractSqliteDriver";

export class SqliteDriver extends AbstractSqliteDriver {
    options: SqliteConnectionOptions;

    sqlite: any;

    constructor(connection: Connection) {
        super(connection);

        this.connection = connection;
        this.options = connection.options as SqliteConnectionOptions;
        this.database = this.options.database;

        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // load sqlite package
        this.loadDependencies();
    }

    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.queryRunner = undefined;
            this.databaseConnection.close((err: any) => err ? fail(err) : ok());
        });
    }

    createQueryRunner(mode: "master"|"slave" = "master"): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new SqliteQueryRunner(this);

        return this.queryRunner;
    }

    normalizeType(column: { type?: ColumnType, length?: number | string, precision?: number|null, scale?: number }): string {
        if ((column.type as any) === Buffer) {
            return "blob";
        }

        return super.normalizeType(column);
    }

    protected createDatabaseConnection() {
        return new Promise<void>(async (ok, fail) => {
            await this.createDatabaseDirectory(this.options.database);
            const databaseConnection = new this.sqlite.Database(this.options.database, (err: any) => {
                if (err) return fail(err);

                databaseConnection.run(`PRAGMA foreign_keys = ON;`, (err: any, result: any) => {
                    if (err) return fail(err);
                    ok(databaseConnection);
                });
            });
        });
    }

    protected loadDependencies(): void {
        try {
            this.sqlite = PlatformTools.load("sqlite3").verbose();

        } catch (e) {
            throw new DriverPackageNotInstalledError("SQLite", "sqlite3");
        }
    }

    protected createDatabaseDirectory(fullPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const mkdirp = PlatformTools.load("mkdirp");
            const path = PlatformTools.load("path");
            mkdirp(path.dirname(fullPath), (err: any) => err ? reject(err) : resolve());
        });
    }

}