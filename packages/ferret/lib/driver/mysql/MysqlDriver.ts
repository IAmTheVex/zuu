import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {MysqlQueryRunner} from "./MysqlQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {MysqlConnectionOptions} from "./MysqlConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {MysqlConnectionCredentialsOptions} from "./MysqlConnectionCredentialsOptions";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";

export class MysqlDriver implements Driver {

    connection: Connection;

    mysql: any;

    pool: any;

    poolCluster: any;

    options: MysqlConnectionOptions;

    database?: string;

    isReplicated: boolean = false;

    treeSupport = true;

    supportedDataTypes: ColumnType[] = [
        "int",
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "float",
        "double",
        "dec",
        "decimal",
        "numeric",
        "date",
        "datetime",
        "timestamp",
        "time",
        "year",
        "char",
        "varchar",
        "nvarchar",
        "blob",
        "text",
        "tinyblob",
        "tinytext",
        "mediumblob",
        "mediumtext",
        "longblob",
        "longtext",
        "enum",
        "json",
        "binary",
        "varbinary",
        "geometry",
        "point",
        "linestring",
        "polygon",
        "multipoint",
        "multilinestring",
        "multipolygon",
        "geometrycollection"
    ];

    spatialTypes: ColumnType[] = [
        "geometry",
        "point",
        "linestring",
        "polygon",
        "multipoint",
        "multilinestring",
        "multipolygon",
        "geometrycollection"
    ];

    withLengthColumnTypes: ColumnType[] = [
        "char",
        "varchar",
        "nvarchar",
        "binary",
        "varbinary"
    ];

    withWidthColumnTypes: ColumnType[] = [
        "tinyint",
        "smallint",
        "mediumint",
        "int",
        "bigint"
    ];

    withPrecisionColumnTypes: ColumnType[] = [
        "decimal",
        "float",
        "double",
        "time",
        "datetime",
        "timestamp"
    ];

    withScaleColumnTypes: ColumnType[] = [
        "decimal",
        "float",
        "double",
    ];

    unsignedAndZerofillTypes: ColumnType[] = [
        "int",
        "smallint",
        "tinyint",
        "mediumint",
        "bigint",
        "decimal",
        "float",
        "double"
    ];

    mappedDataTypes: MappedColumnTypes = {
        createDate: "datetime",
        createDatePrecision: 6,
        createDateDefault: "CURRENT_TIMESTAMP(6)",
        updateDate: "datetime",
        updateDatePrecision: 6,
        updateDateDefault: "CURRENT_TIMESTAMP(6)",
        version: "int",
        treeLevel: "int",
        migrationId: "int",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
        cacheId: "int",
        cacheIdentifier: "varchar",
        cacheTime: "bigint",
        cacheDuration: "int",
        cacheQuery: "text",
        cacheResult: "text",
    };

    dataTypeDefaults: DataTypeDefaults = {
        "varchar": { length: 255 },
        "char": { length: 1 },
        "binary": { length: 1 },
        "varbinary": { length: 255 },
        "decimal": { precision: 10, scale: 0 },
        "float": { precision: 12 },
        "double": { precision: 22 },
        "int": { width: 11 },
        "tinyint": { width: 4 },
        "smallint": { width: 6 },
        "mediumint": { width: 9 },
        "bigint": { width: 20 }
    };

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as MysqlConnectionOptions;
        this.isReplicated = this.options.replication ? true : false;

        this.loadDependencies();

        this.database = this.options.replication ? this.options.replication.master.database : this.options.database;
    }

    async connect(): Promise<void> {

        if (this.options.replication) {
            this.poolCluster = this.mysql.createPoolCluster(this.options.replication);
            this.options.replication.slaves.forEach((slave, index) => {
                this.poolCluster.add("SLAVE" + index, this.createConnectionOptions(this.options, slave));
            });
            this.poolCluster.add("MASTER", this.createConnectionOptions(this.options, this.options.replication.master));

        } else {
            this.pool = await this.createPool(this.createConnectionOptions(this.options, this.options));
        }
    }

    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    async disconnect(): Promise<void> {
        if (!this.poolCluster && !this.pool)
            return Promise.reject(new ConnectionIsNotSetError("mysql"));

        if (this.poolCluster) {
            return new Promise<void>((ok, fail) => {
                this.poolCluster.end((err: any) => err ? fail(err) : ok());
                this.poolCluster = undefined;
            });
        }
        if (this.pool) {
            return new Promise<void>((ok, fail) => {
                this.pool.end((err: any) => {
                    if (err) return fail(err);
                    this.pool = undefined;
                    ok();
                });
            });
        }
    }

    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection);
    }

    createQueryRunner(mode: "master"|"slave" = "master") {
        return new MysqlQueryRunner(this, mode);
    }

    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        const escapedParameters: any[] = Object.keys(nativeParameters).map(key => nativeParameters[key]);
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters];

        const keys = Object.keys(parameters).map(parameter => "(:(\\.\\.\\.)?" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string) => {
            let value: any;
            if (key.substr(0, 4) === ":...") {
                value = parameters[key.substr(4)];
            } else {
                value = parameters[key.substr(1)];
            }

            if (value instanceof Function) {
                return value();

            } else {
                escapedParameters.push(value);
                return "?";
            }
        });
        return [sql, escapedParameters];
    }

    escape(columnName: string): string {
        return "`" + columnName + "`";
    }

    buildTableName(tableName: string, schema?: string, database?: string): string {
        return database ? `${database}.${tableName}` : tableName;
    }

    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.to(value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value);

        } else if (columnMetadata.type === "json") {
            return JSON.stringify(value);

        } else if (columnMetadata.type === "timestamp" || columnMetadata.type === "datetime" || columnMetadata.type === Date) {
            return DateUtils.mixedDateToDate(value);

        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value);

        } else if (columnMetadata.type === "simple-json") {
            return DateUtils.simpleJsonToString(value);
        }

        return value;
    }

    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            value = value ? true : false;

        } else if (columnMetadata.type === "datetime" || columnMetadata.type === Date) {
            value = DateUtils.normalizeHydratedDate(value);

        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "json") {
            value = typeof value === "string" ? JSON.parse(value) : value;

        } else if (columnMetadata.type === "time") {
            value = DateUtils.mixedTimeToString(value);

        } else if (columnMetadata.type === "simple-array") {
            value = DateUtils.stringToSimpleArray(value);

        } else if (columnMetadata.type === "simple-json") {
            value = DateUtils.stringToSimpleJson(value);
        }

        if (columnMetadata.transformer)
            value = columnMetadata.transformer.from(value);

        return value;
    }

    normalizeType(column: { type: ColumnType, length?: number|string, precision?: number|null, scale?: number }): string {
        if (column.type === Number || column.type === "integer") {
            return "int";

        } else if (column.type === String || column.type === "nvarchar") {
            return "varchar";

        } else if (column.type === Date) {
            return "datetime";

        } else if ((column.type as any) === Buffer) {
            return "blob";

        } else if (column.type === Boolean) {
            return "tinyint";

        } else if (column.type === "numeric" || column.type === "dec") {
            return "decimal";

        } else if (column.type === "uuid") {
            return "varchar";

        } else if (column.type === "simple-array" || column.type === "simple-json") {
            return "text";

        } else {
            return column.type as string || "";
        }
    }

    normalizeDefault(columnMetadata: ColumnMetadata): string {
        const defaultValue = columnMetadata.default;

        if (typeof defaultValue === "number") {
            return "" + defaultValue;

        } else if (typeof defaultValue === "boolean") {
            return defaultValue === true ? "1" : "0";

        } else if (typeof defaultValue === "function") {
            return defaultValue();

        } else if (typeof defaultValue === "string") {
            return `'${defaultValue}'`;

        } else {
            return defaultValue;
        }
    }

    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.indices.some(idx => idx.isUnique && idx.columns.length === 1 && idx.columns[0] === column);
    }

    getColumnLength(column: ColumnMetadata|TableColumn): string {
        if (column.length)
            return column.length.toString();

        switch (column.type) {
            case String:
            case "varchar":
            case "nvarchar":
                return "255";
            case "uuid":
                return "36";
            case "varbinary":
                return "255";
            default:
                return "";
        }
    }

    createFullType(column: TableColumn): string {
        let type = column.type;

        // used 'getColumnLength()' method, because MySQL requires column length for `varchar`, `nvarchar` and `varbinary` data types
        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`;

        } else if (column.width) {
            type += `(${column.width})`;

        } else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            type += `(${column.precision},${column.scale})`;

        } else if (column.precision !== null && column.precision !== undefined) {
            type += `(${column.precision})`;
        }

        if (column.isArray)
            type += " array";

        return type;
    }

    obtainMasterConnection(): Promise<any> {
        return new Promise<any>((ok, fail) => {
            if (this.poolCluster) {
                this.poolCluster.getConnection("MASTER", (err: any, dbConnection: any) => {
                    err ? fail(err) : ok(this.prepareDbConnection(dbConnection));
                });

            } else if (this.pool) {
                this.pool.getConnection((err: any, dbConnection: any) => {
                    err ? fail(err) : ok(this.prepareDbConnection(dbConnection));
                });
            } else {
                fail(new Error(`Connection is not established with mysql database`));
            }
        });
    }

    obtainSlaveConnection(): Promise<any> {
        if (!this.poolCluster)
            return this.obtainMasterConnection();

        return new Promise<any>((ok, fail) => {
            this.poolCluster.getConnection("SLAVE*", (err: any, dbConnection: any) => {
                err ? fail(err) : ok(dbConnection);
            });
        });
    }

    createGeneratedMap(metadata: EntityMetadata, insertResult: any) {
        const generatedMap = metadata.generatedColumns.reduce((map, generatedColumn) => {
            let value: any;
            if (generatedColumn.generationStrategy === "increment" && insertResult.insertId) {
                value = insertResult.insertId;
            }

            return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
        }, {} as ObjectLiteral);

        return Object.keys(generatedMap).length > 0 ? generatedMap : undefined;
    }

    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        return columnMetadatas.filter(columnMetadata => {
            const tableColumn = tableColumns.find(c => c.name === columnMetadata.databaseName);
            if (!tableColumn)
                return false;

            return tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type !== this.normalizeType(columnMetadata)
                || tableColumn.length !== columnMetadata.length
                || tableColumn.width !== columnMetadata.width
                || tableColumn.precision !== columnMetadata.precision
                || tableColumn.scale !== columnMetadata.scale
                || tableColumn.zerofill !== columnMetadata.zerofill
                || tableColumn.unsigned !== columnMetadata.unsigned
                || tableColumn.asExpression !== columnMetadata.asExpression
                || tableColumn.generatedType !== columnMetadata.generatedType
                // || tableColumn.comment !== columnMetadata.comment // todo
                || !this.compareDefaultValues(this.normalizeDefault(columnMetadata), tableColumn.default)
                || tableColumn.onUpdate !== columnMetadata.onUpdate
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)
                || (columnMetadata.generationStrategy !== "uuid" && tableColumn.isGenerated !== columnMetadata.isGenerated);
        });
    }

    isReturningSqlSupported(): boolean {
        return false;
    }

    isUUIDGenerationSupported(): boolean {
        return false;
    }

    createParameter(parameterName: string, index: number): string {
        return "?";
    }

    protected loadDependencies(): void {
        try {
            this.mysql = PlatformTools.load("mysql");  // try to load first supported package
            if (Object.keys(this.mysql).length === 0) {
                throw new Error("'mysql' was found but it is empty. Falling back to 'mysql2'.");
            }
        } catch (e) {
            try {
                this.mysql = PlatformTools.load("mysql2"); // try to load second supported package

            } catch (e) {
                throw new DriverPackageNotInstalledError("Mysql", "mysql");
            }
        }
    }

    protected createConnectionOptions(options: MysqlConnectionOptions, credentials: MysqlConnectionCredentialsOptions): Promise<any> {

        credentials = Object.assign(credentials, DriverUtils.buildDriverOptions(credentials)); // todo: do it better way

        return Object.assign({}, {
            charset: options.charset,
            timezone: options.timezone,
            connectTimeout: options.connectTimeout,
            insecureAuth: options.insecureAuth,
            supportBigNumbers: options.supportBigNumbers !== undefined ? options.supportBigNumbers : true,
            bigNumberStrings: options.bigNumberStrings !== undefined ? options.bigNumberStrings : true,
            dateStrings: options.dateStrings,
            debug: options.debug,
            trace: options.trace,
            multipleStatements: options.multipleStatements,
            flags: options.flags
        }, {
            host: credentials.host,
            user: credentials.username,
            password: credentials.password,
            database: credentials.database,
            port: credentials.port,
            ssl: options.ssl
        }, options.extra || {});
    }

    protected createPool(connectionOptions: any): Promise<any> {

        const pool = this.mysql.createPool(connectionOptions);

        return new Promise<void>((ok, fail) => {
            pool.getConnection((err: any, connection: any) => {
                if (err)
                    return pool.end(() => fail(err));

                connection.release();
                ok(pool);
            });
        });
    }

    private prepareDbConnection(connection: any): any {
        const { logger } = this.connection;
        if (connection.listeners("error").length === 0) {
            connection.on("error", (error: any) => logger.log("warn", `MySQL connection raised an error. ${error}`));
        }
        return connection;
    }

    protected compareDefaultValues(columnMetadataValue: string, databaseValue: string): boolean {
        if (typeof columnMetadataValue === "string" && typeof databaseValue === "string") {
            columnMetadataValue = columnMetadataValue.replace(/^'+|'+$/g, "");
            databaseValue = databaseValue.replace(/^'+|'+$/g, "");
        }

        return columnMetadataValue === databaseValue;
    }
}
