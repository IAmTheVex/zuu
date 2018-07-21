import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {MongoQueryRunner} from "./MongoQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {MongoConnectionOptions} from "./MongoConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {MongoSchemaBuilder} from "../../schema-builder/MongoSchemaBuilder";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {ConnectionOptions} from "../../connection/ConnectionOptions";
import {EntityMetadata} from "../../metadata/EntityMetadata";

export class MongoDriver implements Driver {

    queryRunner?: MongoQueryRunner;
    
    options: MongoConnectionOptions;

    database?: string;

    isReplicated: boolean = false;

    treeSupport = false;

    supportedDataTypes: ColumnType[] = [];

    spatialTypes: ColumnType[] = [];

    withLengthColumnTypes: ColumnType[] = [];

    withPrecisionColumnTypes: ColumnType[] = [];

    withScaleColumnTypes: ColumnType[] = [];

    mappedDataTypes: MappedColumnTypes = {
        createDate: "int",
        createDateDefault: "",
        updateDate: "int",
        updateDateDefault: "",
        version: "int",
        treeLevel: "int",
        migrationId: "int",
        migrationName: "int",
        migrationTimestamp: "int",
        cacheId: "int",
        cacheIdentifier: "int",
        cacheTime: "int",
        cacheDuration: "int",
        cacheQuery: "int",
        cacheResult: "int",
    };

    dataTypeDefaults: DataTypeDefaults;

    protected mongodb: any;

    constructor(protected connection: Connection) {
        this.options = connection.options as MongoConnectionOptions;

        this.validateOptions(connection.options);

        this.loadDependencies();
    }

    connect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.mongodb.MongoClient.connect(this.buildConnectionUrl(), {
                poolSize: this.options.poolSize,
                ssl: this.options.ssl,
                sslValidate: this.options.sslValidate,
                sslCA: this.options.sslCA,
                sslCert: this.options.sslCert,
                sslKey: this.options.sslKey,
                sslPass: this.options.sslPass,
                autoReconnect: this.options.autoReconnect,
                noDelay: this.options.noDelay,
                keepAlive: this.options.keepAlive,
                connectTimeoutMS: this.options.connectTimeoutMS,
                socketTimeoutMS: this.options.socketTimeoutMS,
                reconnectTries: this.options.reconnectTries,
                reconnectInterval: this.options.reconnectInterval,
                ha: this.options.ha,
                haInterval: this.options.haInterval,
                replicaSet: this.options.replicaSet,
                acceptableLatencyMS: this.options.acceptableLatencyMS,
                secondaryAcceptableLatencyMS: this.options.secondaryAcceptableLatencyMS,
                connectWithNoPrimary: this.options.connectWithNoPrimary,
                authSource: this.options.authSource,
                w: this.options.w,
                wtimeout: this.options.wtimeout,
                j: this.options.j,
                forceServerObjectId: this.options.forceServerObjectId,
                serializeFunctions: this.options.serializeFunctions,
                ignoreUndefined: this.options.ignoreUndefined,
                raw: this.options.raw,
                promoteLongs: this.options.promoteLongs,
                promoteBuffers: this.options.promoteBuffers,
                promoteValues: this.options.promoteValues,
                domainsEnabled: this.options.domainsEnabled,
                bufferMaxEntries: this.options.bufferMaxEntries,
                readPreference: this.options.readPreference,
                pkFactory: this.options.pkFactory,
                promiseLibrary: this.options.promiseLibrary,
                readConcern: this.options.readConcern,
                maxStalenessSeconds: this.options.maxStalenessSeconds,
                loggerLevel: this.options.loggerLevel,
                logger: this.options.logger,
                authMechanism: this.options.authMechanism
            }, (err: any, client: any) => {
                if (err) return fail(err);

                this.queryRunner = new MongoQueryRunner(this.connection, client);
                Object.assign(this.queryRunner, { manager: this.connection.manager });
                ok();
            });
        });
    }

    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            if (!this.queryRunner)
                return fail(new ConnectionIsNotSetError("mongodb"));

            const handler = (err: any) => err ? fail(err) : ok();
            this.queryRunner.databaseConnection.close(handler);
            this.queryRunner = undefined;
        });
    }

    createSchemaBuilder() {
        return new MongoSchemaBuilder(this.connection);
    }

    createQueryRunner(mode: "master"|"slave" = "master") {
        return this.queryRunner!;
    }

    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        throw new Error(`This operation is not supported by Mongodb driver.`);
    }

    escape(columnName: string): string {
        return columnName;
    }

    buildTableName(tableName: string, schema?: string, database?: string): string {
        return tableName;
    }

    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.to(value);
        return value;
    }

    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.from(value);
        return value;
    }

    normalizeType(column: { type?: ColumnType, length?: number | string, precision?: number|null, scale?: number }): string {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    normalizeDefault(columnMetadata: ColumnMetadata): string {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    normalizeIsUnique(column: ColumnMetadata): boolean {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    getColumnLength(column: ColumnMetadata): string {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }
    
    createFullType(column: TableColumn): string {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    obtainMasterConnection(): Promise<any> {
        return Promise.resolve();
    }

    obtainSlaveConnection(): Promise<any> {
        return Promise.resolve();
    }

    createGeneratedMap(metadata: EntityMetadata, insertedId: any) {
        return metadata.objectIdColumn!.createValueMap(insertedId);
    }

    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        throw new Error(`MongoDB is schema-less, not supported by this driver.`);
    }

    isReturningSqlSupported(): boolean {
        return false;
    }

    isUUIDGenerationSupported(): boolean {
        return false;
    }

    createParameter(parameterName: string, index: number): string {
        return "";
    }

    protected validateOptions(options: ConnectionOptions) { // todo: fix

    }

    protected loadDependencies(): any {
        try {
            this.mongodb = PlatformTools.load("mongodb");  // try to load native driver dynamically

        } catch (e) {
            throw new DriverPackageNotInstalledError("MongoDB", "mongodb");
        }
    }

    protected buildConnectionUrl(): string {
        if (this.options.url)
            return this.options.url;

        const credentialsUrlPart = (this.options.username && this.options.password)
            ? `${this.options.username}:${this.options.password}@`
            : "";

        return `mongodb://${credentialsUrlPart}${this.options.host || "127.0.0.1"}:${this.options.port || "27017"}/${this.options.database}`;
    }

}