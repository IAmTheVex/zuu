import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {OracleQueryRunner} from "./OracleQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {OracleConnectionOptions} from "./OracleConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {OracleConnectionCredentialsOptions} from "./OracleConnectionCredentialsOptions";
import {DriverUtils} from "../DriverUtils";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";

export class OracleDriver implements Driver {

    connection: Connection;

    oracle: any;

    master: any;

    slaves: any[] = [];

    options: OracleConnectionOptions;

    database?: string;

    isReplicated: boolean = false;

    treeSupport = true;

    supportedDataTypes: ColumnType[] = [
        "char",
        "nchar",
        "nvarchar2",
        "varchar2",
        "long",
        "raw",
        "long raw",
        "number",
        "numeric",
        "float",
        "dec",
        "decimal",
        "integer",
        "int",
        "smallint",
        "real",
        "double precision",
        "date",
        "timestamp",
        "timestamp with time zone",
        "timestamp with local time zone",
        "interval year to month",
        "interval day to second",
        "bfile",
        "blob",
        "clob",
        "nclob",
        "rowid",
        "urowid"
    ];

    spatialTypes: ColumnType[] = [];

    withLengthColumnTypes: ColumnType[] = [
        "char",
        "nchar",
        "nvarchar2",
        "varchar2",
        "varchar",
        "raw"
    ];

    withPrecisionColumnTypes: ColumnType[] = [
        "number",
        "float",
        "timestamp",
        "timestamp with time zone",
        "timestamp with local time zone"
    ];

    withScaleColumnTypes: ColumnType[] = [
        "number"
    ];

    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDateDefault: "CURRENT_TIMESTAMP",
        updateDate: "timestamp",
        updateDateDefault: "CURRENT_TIMESTAMP",
        version: "number",
        treeLevel: "number",
        migrationId: "number",
        migrationName: "varchar2",
        migrationTimestamp: "number",
        cacheId: "number",
        cacheIdentifier: "varchar2",
        cacheTime: "number",
        cacheDuration: "number",
        cacheQuery: "clob",
        cacheResult: "clob",
    };

    dataTypeDefaults: DataTypeDefaults = {
        "char": { length: 1 },
        "nchar": { length: 1 },
        "varchar": { length: 255 },
        "varchar2": { length: 255 },
        "nvarchar2": { length: 255 },
        "raw": { length: 2000 },
        "float": { precision: 126 },
        "timestamp": { precision: 6 },
        "timestamp with time zone": { precision: 6 },
        "timestamp with local time zone": { precision: 6 }
    };

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as OracleConnectionOptions;

        this.loadDependencies();

        this.oracle.outFormat = this.oracle.OBJECT;

    }

    async connect(): Promise<void> {
        this.oracle.fetchAsString = [ this.oracle.CLOB ];
        this.oracle.fetchAsBuffer = [ this.oracle.BLOB ];
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
            return Promise.reject(new ConnectionIsNotSetError("oracle"));

        await this.closePool(this.master);
        await Promise.all(this.slaves.map(slave => this.closePool(slave)));
        this.master = undefined;
        this.slaves = [];
    }

    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection);
    }

    createQueryRunner(mode: "master"|"slave" = "master") {
        return new OracleQueryRunner(this, mode);
    }

    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        const escapedParameters: any[] = Object.keys(nativeParameters).map(key => {
            if (typeof nativeParameters[key] === "boolean")
                return nativeParameters[key] ? 1 : 0;
            return nativeParameters[key];
        });
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
                return value.map((v: any, index: number) => {
                    escapedParameters.push(v);
                    return `:${key.substr(4)}${index}`;
                }).join(", ");

            } else if (value instanceof Function) {
                return value();

            } else if (typeof value === "boolean") {
                return value ? 1 : 0;

            } else {
                escapedParameters.push(value);
                return key;
            }
        });
        return [sql, escapedParameters];
    }

    escape(columnName: string): string {
        return `"${columnName}"`;
    }

    buildTableName(tableName: string, schema?: string, database?: string): string {
        return tableName;
    }

    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.to(value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            return value ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            if (typeof value === "string")
                value = value.replace(/[^0-9-]/g, "");
            return () => `TO_DATE('${DateUtils.mixedDateToDateString(value)}', 'YYYY-MM-DD')`;

        } else if (columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp with local time zone") {
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
            value = value === 1 ? true : false;

        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            value = DateUtils.mixedTimeToString(value);

        } else if (columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp with local time zone") {
            value = DateUtils.normalizeHydratedDate(value);

        } else if (columnMetadata.type === "json") {
            value = JSON.parse(value);

        } else if (columnMetadata.type === "simple-array") {
            value = DateUtils.stringToSimpleArray(value);

        } else if (columnMetadata.type === "simple-json") {
            value = DateUtils.stringToSimpleJson(value);
        }

        if (columnMetadata.transformer)
            value = columnMetadata.transformer.from(value);

        return value;
    }

    normalizeType(column: { type?: ColumnType, length?: number|string, precision?: number|null, scale?: number, isArray?: boolean }): string {
        if (column.type === Number || column.type === Boolean || column.type === "numeric"
            || column.type === "dec" || column.type === "decimal" || column.type === "int"
            || column.type === "integer" || column.type === "smallint") {
            return "number";

        } else if (column.type === "real" || column.type === "double precision") {
            return "float";

        } else if (column.type === String || column.type === "varchar") {
            return "varchar2";

        } else if (column.type === Date) {
            return "timestamp";

        } else if ((column.type as any) === Buffer) {
            return "blob";

        } else if (column.type === "uuid") {
            return "varchar2";

        } else if (column.type === "simple-array") {
            return "clob";

        } else if (column.type === "simple-json") {
            return "clob";

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
        return column.entityMetadata.uniques.some(uq => uq.columns.length === 1 && uq.columns[0] === column);
    }

    getColumnLength(column: ColumnMetadata|TableColumn): string {
        if (column.length)
            return column.length.toString();

        switch (column.type) {
            case String:
            case "varchar":
            case "varchar2":
            case "nvarchar2":
                return "255";
            case "raw":
                return "2000";
            case "uuid":
                return "36";
            default:
                return "";
        }
    }

    createFullType(column: TableColumn): string {
        let type = column.type;

        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`;

        } else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            type += "(" + column.precision + "," + column.scale + ")";

        } else if (column.precision !== null && column.precision !== undefined) {
            type += "(" + column.precision + ")";
        }

        if (column.type === "timestamp with time zone") {
            type = "TIMESTAMP" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "") + " WITH TIME ZONE";

        } else if (column.type === "timestamp with local time zone") {
            type = "TIMESTAMP" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "") + " WITH LOCAL TIME ZONE";
        }

        if (column.isArray)
            type += " array";

        return type;
    }

    obtainMasterConnection(): Promise<any> {
        return new Promise<any>((ok, fail) => {
            this.master.getConnection((err: any, connection: any, release: Function) => {
                if (err) return fail(err);
                ok(connection);
            });
        });
    }

    obtainSlaveConnection(): Promise<any> {
        if (!this.slaves.length)
            return this.obtainMasterConnection();

        return new Promise<any>((ok, fail) => {
            const random = Math.floor(Math.random() * this.slaves.length);

            this.slaves[random].getConnection((err: any, connection: any) => {
                if (err) return fail(err);
                ok(connection);
            });
        });
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
                return false; // we don't need new columns, we only need exist and changed

            return tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type !== this.normalizeType(columnMetadata)
                || tableColumn.length !== columnMetadata.length
                || tableColumn.precision !== columnMetadata.precision
                || tableColumn.scale !== columnMetadata.scale
                // || tableColumn.comment !== columnMetadata.comment || // todo
                || this.normalizeDefault(columnMetadata) !== tableColumn.default
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)
                || (columnMetadata.generationStrategy !== "uuid" && tableColumn.isGenerated !== columnMetadata.isGenerated);
        });
    }

    isReturningSqlSupported(): boolean {
        return true;
    }

    isUUIDGenerationSupported(): boolean {
        return false;
    }

    createParameter(parameterName: string, index: number): string {
        return ":" + parameterName;
    }

    columnTypeToNativeParameter(type: ColumnType): any {
        switch (this.normalizeType({ type: type as any })) {
            case "number":
            case "numeric":
            case "int":
            case "integer":
            case "smallint":
            case "dec":
            case "decimal":
                return this.oracle.NUMBER;
            case "char":
            case "nchar":
            case "nvarchar2":
            case "varchar2":
                return this.oracle.STRING;
            case "blob":
                return this.oracle.BLOB;
            case "clob":
                return this.oracle.CLOB;
            case "date":
            case "timestamp":
            case "timestamp with time zone":
            case "timestamp with local time zone":
                return this.oracle.DATE;
        }
    }

    protected loadDependencies(): void {
        try {
            this.oracle = PlatformTools.load("oracledb");

        } catch (e) {
            throw new DriverPackageNotInstalledError("Oracle", "oracledb");
        }
    }

    protected async createPool(options: OracleConnectionOptions, credentials: OracleConnectionCredentialsOptions): Promise<any> {

        credentials = Object.assign(credentials, DriverUtils.buildDriverOptions(credentials)); // todo: do it better way

        const connectionOptions = Object.assign({}, {
            user: credentials.username,
            password: credentials.password,
            connectString: credentials.host + ":" + credentials.port + "/" + credentials.sid,
        }, options.extra || {});

        return new Promise<void>((ok, fail) => {
            this.oracle.createPool(connectionOptions, (err: any, pool: any) => {
                if (err)
                    return fail(err);
                ok(pool);
            });
        });

    }

    protected async closePool(pool: any): Promise<void> {
        return new Promise<void>((ok, fail) => {
            pool.close((err: any) => err ? fail(err) : ok());
            pool = undefined;
        });
    }
}
