import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {SqlServerQueryRunner} from "./SqlServerQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {SqlServerConnectionOptions} from "./SqlServerConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {MssqlParameter} from "./MssqlParameter";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {SqlServerConnectionCredentialsOptions} from "./SqlServerConnectionCredentialsOptions";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";

export class SqlServerDriver implements Driver {

    connection: Connection;

    mssql: any;

    master: any;

    slaves: any[] = [];

    options: SqlServerConnectionOptions;

    database?: string;

    isReplicated: boolean = false;

    treeSupport = true;

    /**
     * @see https://docs.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql
     */
    supportedDataTypes: ColumnType[] = [
        "int",
        "bigint",
        "bit",
        "decimal",
        "money",
        "numeric",
        "smallint",
        "smallmoney",
        "tinyint",
        "float",
        "real",
        "date",
        "datetime2",
        "datetime",
        "datetimeoffset",
        "smalldatetime",
        "time",
        "char",
        "varchar",
        "text",
        "nchar",
        "nvarchar",
        "ntext",
        "binary",
        "image",
        "varbinary",
        "hierarchyid",
        "sql_variant",
        "timestamp",
        "uniqueidentifier",
        "xml",
        "geometry",
        "geography"
    ];

    spatialTypes: ColumnType[] = [
        "geometry",
        "geography"
    ];

    withLengthColumnTypes: ColumnType[] = [
        "char",
        "varchar",
        "nchar",
        "nvarchar",
        "binary",
        "varbinary"
    ];

    withPrecisionColumnTypes: ColumnType[] = [
        "decimal",
        "numeric",
        "time",
        "datetime2",
        "datetimeoffset"
    ];

    withScaleColumnTypes: ColumnType[] = [
        "decimal",
        "numeric"
    ];

    mappedDataTypes: MappedColumnTypes = {
        createDate: "datetime2",
        createDateDefault: "getdate()",
        updateDate: "datetime2",
        updateDateDefault: "getdate()",
        version: "int",
        treeLevel: "int",
        migrationId: "int",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
        cacheId: "int",
        cacheIdentifier: "nvarchar",
        cacheTime: "bigint",
        cacheDuration: "int",
        cacheQuery: "nvarchar(MAX)" as any,
        cacheResult: "nvarchar(MAX)" as any,
    };

    dataTypeDefaults: DataTypeDefaults = {
        "char": { length: 1 },
        "nchar": { length: 1 },
        "varchar": { length: 255 },
        "nvarchar": { length: 255 },
        "binary": { length: 1 },
        "varbinary": { length: 1 },
        "decimal": { precision: 18, scale: 0 },
        "numeric": { precision: 18, scale: 0 },
        "time": { precision: 7 },
        "datetime2": { precision: 7 },
        "datetimeoffset": { precision: 7 }
    };

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as SqlServerConnectionOptions;
        this.isReplicated = this.options.replication ? true : false;

        this.loadDependencies();
    }

    async connect(): Promise<void> {

        if (this.options.replication) {
            this.slaves = await Promise.all(this.options.replication.slaves.map(slave => {
                return this.createPool(this.options, slave);
            }));
            this.master = await this.createPool(this.options, this.options.replication.master);
            this.database = this.options.replication.master.database;

        } else {
            this.master = await this.createPool(this.options, this.options);
            this.database = this.options.database;
        }
    }

    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    async disconnect(): Promise<void> {
        if (!this.master)
            return Promise.reject(new ConnectionIsNotSetError("mssql"));

        this.master.close();
        this.slaves.forEach(slave => slave.close());
        this.master = undefined;
        this.slaves = [];
    }

    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection);
    }

    createQueryRunner(mode: "master"|"slave" = "master") {
        return new SqlServerQueryRunner(this, mode);
    }

    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        const escapedParameters: any[] = Object.keys(nativeParameters).map(key => nativeParameters[key]);
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters];

        const keys = Object.keys(parameters).map(parameter => "(:(\\.\\.\\.)?" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string) => {
            let value: any;
            let isArray = false;
            if (key.substr(0, 4) === ":...") {
                isArray = true;
                value = parameters[key.substr(4)];
            } else {
                value = parameters[key.substr(1)];
            }

            if (isArray) {
                return value.map((v: any) => {
                    escapedParameters.push(v);
                    return "@" + (escapedParameters.length - 1);
                }).join(", ");

            } else if (value instanceof Function) {
                return value();

            } else {
                escapedParameters.push(value);
                return "@" + (escapedParameters.length - 1);
            }
        });
        return [sql, escapedParameters];
    }

    escape(columnName: string): string {
        return `"${columnName}"`;
    }

    buildTableName(tableName: string, schema?: string, database?: string): string {
        let fullName = tableName;
        if (schema)
            fullName = schema + "." + tableName;
        if (database) {
            if (!schema) {
                fullName = database + ".." + tableName;
            } else {
                fullName = database + "." + fullName;
            }
        }

        return fullName;
    }

    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.to(value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDate(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedTimeToDate(value);

        } else if (columnMetadata.type === "datetime"
            || columnMetadata.type === "smalldatetime"
            || columnMetadata.type === Date) {
            return DateUtils.mixedDateToDate(value, false, false);

        } else if (columnMetadata.type === "datetime2"
            || columnMetadata.type === "datetimeoffset") {
            return DateUtils.mixedDateToDate(value, false, true);

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

        } else if (columnMetadata.type === "datetime"
            || columnMetadata.type === Date
            || columnMetadata.type === "datetime2"
            || columnMetadata.type === "smalldatetime"
            || columnMetadata.type === "datetimeoffset") {
            value = DateUtils.normalizeHydratedDate(value);

        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value);

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

    normalizeType(column: { type?: ColumnType, length?: number | string, precision?: number|null, scale?: number }): string {
        if (column.type === Number || column.type === "integer") {
            return "int";

        } else if (column.type === String) {
            return "nvarchar";

        } else if (column.type === Date) {
            return "datetime";

        } else if (column.type === Boolean) {
            return "bit";

        } else if ((column.type as any) === Buffer) {
            return "binary";

        } else if (column.type === "uuid") {
            return "uniqueidentifier";

        } else if (column.type === "simple-array" || column.type === "simple-json") {
            return "ntext";

        } else if (column.type === "dec") {
            return "decimal";

        } else if (column.type === "double precision") {
            return "float";

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
            return /*"(" + */defaultValue()/* + ")"*/;

        } else if (typeof defaultValue === "string") {
            return `'${defaultValue}'`;

        } else {
            return defaultValue;
        }
    }

    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.uniques.some(uq => uq.columns.length === 1 && uq.columns[0] === column);
    }

    getColumnLength(column: ColumnMetadata|TableColumn): string {
        if (column.length)
            return column.length.toString();

        if (column.type === "varchar" || column.type === "nvarchar" || column.type === String)
            return "255";

        return "";
    }

    createFullType(column: TableColumn): string {
        let type = column.type;

        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`;

        } else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            type += `(${column.precision},${column.scale})`;

        } else if (column.precision !== null && column.precision !== undefined) {
            type +=  `(${column.precision})`;
        }

        if (column.isArray)
            type += " array";

        return type;
    }

    obtainMasterConnection(): Promise<any> {
        return Promise.resolve(this.master);
    }

    obtainSlaveConnection(): Promise<any> {
        if (!this.slaves.length)
            return this.obtainMasterConnection();

        const random = Math.floor(Math.random() * this.slaves.length);
        return Promise.resolve(this.slaves[random]);
    }

    createGeneratedMap(metadata: EntityMetadata, insertResult: ObjectLiteral) {
        if (!insertResult)
            return undefined;

        return Object.keys(insertResult).reduce((map, key) => {
            const column = metadata.findColumnWithDatabaseName(key);
            if (column) {
                OrmUtils.mergeDeep(map, column.createValueMap(insertResult[key]));
            }
            return map;
        }, {} as ObjectLiteral);
    }

    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        return columnMetadatas.filter(columnMetadata => {
            const tableColumn = tableColumns.find(c => c.name === columnMetadata.databaseName);
            if (!tableColumn)
                return false;

            return  tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type !== this.normalizeType(columnMetadata)
                || tableColumn.length !== columnMetadata.length
                || tableColumn.precision !== columnMetadata.precision
                || tableColumn.scale !== columnMetadata.scale
                // || tableColumn.comment !== columnMetadata.comment || // todo
                || (!tableColumn.isGenerated && this.normalizeDefault(columnMetadata) !== tableColumn.default) // we included check for generated here, because generated columns already can have default values
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)
                || tableColumn.isGenerated !== columnMetadata.isGenerated;
        });
    }

    isReturningSqlSupported(): boolean {
        return true;
    }

    isUUIDGenerationSupported(): boolean {
        return true;
    }

    createParameter(parameterName: string, index: number): string {
        return "@" + index;
    }

    parametrizeValue(column: ColumnMetadata, value: any) {

        if (value instanceof MssqlParameter)
            return value;

        const normalizedType = this.normalizeType({ type: column.type });
        if (column.length) {
            return new MssqlParameter(value, normalizedType as any, column.length as any);

        } else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            return new MssqlParameter(value, normalizedType as any, column.precision, column.scale);

        } else if (column.precision !== null && column.precision !== undefined) {
            return new MssqlParameter(value, normalizedType as any, column.precision);

        } else if (column.scale !== null && column.scale !== undefined) {
            return new MssqlParameter(value, normalizedType as any, column.scale);
        }

        return new MssqlParameter(value, normalizedType as any);
    }

    parametrizeMap(tablePath: string, map: ObjectLiteral): ObjectLiteral {
        if (!this.connection.hasMetadata(tablePath)) // if no metadata found then we can't proceed because we don't have columns and their types
            return map;
        const metadata = this.connection.getMetadata(tablePath);

        return Object.keys(map).reduce((newMap, key) => {
            const value = map[key];

            const column = metadata.findColumnWithDatabaseName(key);
            if (!column) 
                return value;

            newMap[key] = this.parametrizeValue(column, value);
            return newMap;
        }, {} as ObjectLiteral);
    }

    protected loadDependencies(): void {
        try {
            this.mssql = PlatformTools.load("mssql");

        } catch (e) { // todo: better error for browser env
            throw new DriverPackageNotInstalledError("SQL Server", "mssql");
        }
    }

    protected createPool(options: SqlServerConnectionOptions, credentials: SqlServerConnectionCredentialsOptions): Promise<any> {

        credentials = Object.assign(credentials, DriverUtils.buildDriverOptions(credentials)); // todo: do it better way

        const connectionOptions = Object.assign({}, {
            connectionTimeout: this.options.connectionTimeout,
            requestTimeout: this.options.requestTimeout,
            stream: this.options.stream,
            pool: this.options.pool,
            options: this.options.options,
        }, {
            server: credentials.host,
            user: credentials.username,
            password: credentials.password,
            database: credentials.database,
            port: credentials.port,
            domain: credentials.domain,
        }, options.extra || {});

        if (!connectionOptions.options) connectionOptions.options = { useUTC: false };
        else if (!connectionOptions.options.useUTC) connectionOptions.options.useUTC = false;

        return new Promise<void>((ok, fail) => {
            const pool = new this.mssql.ConnectionPool(connectionOptions);

            const { logger } = this.connection;
            pool.on("error", (error: any) => logger.log("warn", `MSSQL pool raised an error. ${error}`));

            const connection = pool.connect((err: any) => {
                if (err) return fail(err);
                ok(connection);
            });
        });
    }
}
