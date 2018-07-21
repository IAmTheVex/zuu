import {Driver} from "../Driver";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DateUtils} from "../../util/DateUtils";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";

export abstract class AbstractSqliteDriver implements Driver {
    connection: Connection;

    queryRunner?: QueryRunner;

    databaseConnection: any;

    options: BaseConnectionOptions;

    database?: string;

    isReplicated: boolean = false;

    sqlite: any;

    treeSupport = true;

    supportedDataTypes: ColumnType[] = [
        "int",
        "integer",
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "unsigned big int",
        "int2",
        "int8",
        "integer",
        "character",
        "varchar",
        "varying character",
        "nchar",
        "native character",
        "nvarchar",
        "text",
        "clob",
        "text",
        "blob",
        "real",
        "double",
        "double precision",
        "float",
        "real",
        "numeric",
        "decimal",
        "boolean",
        "date",
        "time",
        "datetime"
    ];

    withLengthColumnTypes: ColumnType[] = [
        "character",
        "varchar",
        "varying character",
        "nchar",
        "native character",
        "nvarchar",
        "text",
        "blob",
        "clob"
    ];

    spatialTypes: ColumnType[] = [];

    withPrecisionColumnTypes: ColumnType[] = [];

    withScaleColumnTypes: ColumnType[] = [];

    mappedDataTypes: MappedColumnTypes = {
        createDate: "datetime",
        createDateDefault: "datetime('now')",
        updateDate: "datetime",
        updateDateDefault: "datetime('now')",
        version: "integer",
        treeLevel: "integer",
        migrationId: "integer",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
        cacheId: "int",
        cacheIdentifier: "varchar",
        cacheTime: "bigint",
        cacheDuration: "int",
        cacheQuery: "text",
        cacheResult: "text",
    };

    dataTypeDefaults: DataTypeDefaults;

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as BaseConnectionOptions;
    }

    abstract createQueryRunner(mode: "master"|"slave"): QueryRunner;

    async connect(): Promise<void> {
        this.databaseConnection = await this.createDatabaseConnection();
    }

    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.queryRunner = undefined;
            this.databaseConnection.close((err: any) => err ? fail(err) : ok());
        });
    }

    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection);
    }

    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.to(value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean") {
            return value === true ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value);

        } else if (columnMetadata.type === "datetime" || columnMetadata.type === Date) {
            return DateUtils.mixedDateToUtcDatetimeString(value);

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

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean") {
            value = value ? true : false;

        } else if (columnMetadata.type === "datetime" || columnMetadata.type === Date) {
            if (value && typeof value === "string") {
                value = value.replace(" ", "T") + "Z";
            }

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

    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        const builtParameters: any[] = Object.keys(nativeParameters).map(key => nativeParameters[key]);
        if (!parameters || !Object.keys(parameters).length)
            return [sql, builtParameters];

        const keys = Object.keys(parameters).map(parameter => "(:(\\.\\.\\.)?" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string): string => {
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
                    builtParameters.push(v);
                    return "?";
                }).join(", ");

            } else if (value instanceof Function) {
                return value();

            } else {
                builtParameters.push(value);
                return "?";
                // return "$" + builtParameters.length;
            }
        });
        return [sql, builtParameters];
    }

    escape(columnName: string): string {
        return "\"" + columnName + "\"";
    }

    buildTableName(tableName: string, schema?: string, database?: string): string {
        return tableName;
    }

    normalizeType(column: { type?: ColumnType, length?: number | string, precision?: number|null, scale?: number }): string {
        if (column.type === Number || column.type === "int") {
            return "integer";

        } else if (column.type === String) {
            return "varchar";

        } else if (column.type === Date) {
            return "datetime";

        } else if (column.type === Boolean) {
            return "boolean";

        } else if (column.type === "uuid") {
            return "varchar";

        } else if (column.type === "simple-array") {
            return "text";

        } else if (column.type === "simple-json") {
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
        return column.entityMetadata.uniques.some(uq => uq.columns.length === 1 && uq.columns[0] === column);
    }

    getColumnLength(column: ColumnMetadata): string {
        return column.length ? column.length.toString() : "";
    }

    createFullType(column: TableColumn): string {
        let type = column.type;

        if (column.length) {
            type += "(" + column.length + ")";

        } else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            type += "(" + column.precision + "," + column.scale + ")";

        } else if (column.precision !== null && column.precision !== undefined) {
            type +=  "(" + column.precision + ")";
        }

        if (column.isArray)
            type += " array";

        return type;
    }

    obtainMasterConnection(): Promise<any> {
        return Promise.resolve();
    }

    obtainSlaveConnection(): Promise<any> {
        return Promise.resolve();
    }

    createGeneratedMap(metadata: EntityMetadata, insertResult: any) {
        const generatedMap = metadata.generatedColumns.reduce((map, generatedColumn) => {
            let value: any;
            if (generatedColumn.generationStrategy === "increment" && insertResult) {
                value = insertResult;
            }

            if (!value) return map;
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
                || tableColumn.precision !== columnMetadata.precision
                || tableColumn.scale !== columnMetadata.scale
                //  || tableColumn.comment !== columnMetadata.comment || // todo
                || this.normalizeDefault(columnMetadata) !== tableColumn.default
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

    protected createDatabaseConnection() {
        throw new Error("Do not use AbstractSqlite directly, it has to be used with one of the sqlite drivers");
    }

    protected loadDependencies(): void {
    }
}
