import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {
    AggregationCursor,
    BulkWriteOpResultObject,
    Code,
    Collection,
    CollectionAggregationOptions,
    CollectionBluckWriteOptions,
    CollectionInsertManyOptions,
    CollectionInsertOneOptions,
    CollectionOptions,
    CollStats,
    CommandCursor,
    Cursor,
    Db,
    DeleteWriteOpResultObject,
    FindAndModifyWriteOpResultObject,
    FindOneAndReplaceOption,
    GeoHaystackSearchOptions,
    GeoNearOptions,
    InsertOneWriteOpResult,
    InsertWriteOpResult,
    MapReduceOptions,
    MongoCountPreferences,
    MongodbIndexOptions,
    OrderedBulkOperation,
    ParallelCollectionScanOptions,
    ReadPreference,
    ReplaceOneOptions,
    UnorderedBulkOperation,
    UpdateWriteOpResult
} from "./typings";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {MongoEntityManager} from "../../entity-manager/MongoEntityManager";
import {SqlInMemory} from "../SqlInMemory";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {TableCheck} from "../../schema-builder/table/TableCheck";

export class MongoQueryRunner implements QueryRunner {

    connection: Connection;

    broadcaster: Broadcaster;

    manager: MongoEntityManager;

    isReleased = false;

    isTransactionActive = false;

    data = {};

    loadedTables: Table[];

    databaseConnection: Db;

    constructor(connection: Connection, databaseConnection: Db) {
        this.connection = connection;
        this.databaseConnection = databaseConnection;
        this.broadcaster = new Broadcaster(this);
    }

    cursor(collectionName: string, query?: ObjectLiteral): Cursor<any> {
        return this.getCollection(collectionName).find(query || {});
    }

    aggregate(collectionName: string, pipeline: ObjectLiteral[], options?: CollectionAggregationOptions): AggregationCursor<any> {
        return this.getCollection(collectionName).aggregate(pipeline, options);
    }

    async bulkWrite(collectionName: string, operations: ObjectLiteral[], options?: CollectionBluckWriteOptions): Promise<BulkWriteOpResultObject> {
        return await this.getCollection(collectionName).bulkWrite(operations, options);
    }

    async count(collectionName: string, query?: ObjectLiteral, options?: MongoCountPreferences): Promise<any> {
        return await this.getCollection(collectionName).count(query || {}, options);
    }

    async createCollectionIndex(collectionName: string, fieldOrSpec: string|any, options?: MongodbIndexOptions): Promise<string> {
        return await this.getCollection(collectionName).createIndex(fieldOrSpec, options);
    }

    async createCollectionIndexes(collectionName: string, indexSpecs: ObjectLiteral[]): Promise<void> {
        return await this.getCollection(collectionName).createIndexes(indexSpecs);
    }

    async deleteMany(collectionName: string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return await this.getCollection(collectionName).deleteMany(query, options);
    }

    async deleteOne(collectionName: string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return await this.getCollection(collectionName).deleteOne(query, options);
    }

    async distinct(collectionName: string, key: string, query: ObjectLiteral, options?: { readPreference?: ReadPreference|string }): Promise<any> {
        return await this.getCollection(collectionName).distinct(key, query, options);
    }

    async dropCollectionIndex(collectionName: string, indexName: string, options?: CollectionOptions): Promise<any> {
        return await this.getCollection(collectionName).dropIndex(indexName, options);
    }

    async dropCollectionIndexes(collectionName: string): Promise<any> {
        return await this.getCollection(collectionName).dropIndexes();
    }

    async findOneAndDelete(collectionName: string, query: ObjectLiteral, options?: { projection?: Object, sort?: Object, maxTimeMS?: number }): Promise<FindAndModifyWriteOpResultObject> {
        return await this.getCollection(collectionName).findOneAndDelete(query, options);
    }

    async findOneAndReplace(collectionName: string, query: ObjectLiteral, replacement: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return await this.getCollection(collectionName).findOneAndReplace(query, replacement, options);
    }

    async findOneAndUpdate(collectionName: string, query: ObjectLiteral, update: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return await this.getCollection(collectionName).findOneAndUpdate(query, update, options);
    }

    async geoHaystackSearch(collectionName: string, x: number, y: number, options?: GeoHaystackSearchOptions): Promise<any> {
        return await this.getCollection(collectionName).geoHaystackSearch(x, y, options);
    }

    async geoNear(collectionName: string, x: number, y: number, options?: GeoNearOptions): Promise<any> {
        return await this.getCollection(collectionName).geoNear(x, y, options);
    }

    async group(collectionName: string, keys: Object|Array<any>|Function|Code, condition: Object, initial: Object, reduce: Function|Code, finalize: Function|Code, command: boolean, options?: { readPreference?: ReadPreference | string }): Promise<any> {
        return await this.getCollection(collectionName).group(keys, condition, initial, reduce, finalize, command, options);
    }

    async collectionIndexes(collectionName: string): Promise<any> {
        return await this.getCollection(collectionName).indexes();
    }

    async collectionIndexExists(collectionName: string, indexes: string|string[]): Promise<boolean> {
        return await this.getCollection(collectionName).indexExists(indexes);
    }

    async collectionIndexInformation(collectionName: string, options?: { full: boolean }): Promise<any> {
        return await this.getCollection(collectionName).indexInformation(options);
    }

    initializeOrderedBulkOp(collectionName: string, options?: CollectionOptions): OrderedBulkOperation {
        return this.getCollection(collectionName).initializeOrderedBulkOp(options);
    }

    initializeUnorderedBulkOp(collectionName: string, options?: CollectionOptions): UnorderedBulkOperation {
        return this.getCollection(collectionName).initializeUnorderedBulkOp(options);
    }

    async insertMany(collectionName: string, docs: ObjectLiteral[], options?: CollectionInsertManyOptions): Promise<InsertWriteOpResult> {
        return await this.getCollection(collectionName).insertMany(docs, options);
    }

    async insertOne(collectionName: string, doc: ObjectLiteral, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult> {
        return await this.getCollection(collectionName).insertOne(doc, options);
    }

    async isCapped(collectionName: string): Promise<any> {
        return await this.getCollection(collectionName).isCapped();
    }

    listCollectionIndexes(collectionName: string, options?: { batchSize?: number, readPreference?: ReadPreference|string }): CommandCursor {
        return this.getCollection(collectionName).listIndexes(options);
    }

    async mapReduce(collectionName: string, map: Function|string, reduce: Function|string, options?: MapReduceOptions): Promise<any> {
        return await this.getCollection(collectionName).mapReduce(map, reduce, options);
    }

    async parallelCollectionScan(collectionName: string, options?: ParallelCollectionScanOptions): Promise<Cursor<any>[]> {
        return await this.getCollection(collectionName).parallelCollectionScan(options);
    }

    async reIndex(collectionName: string): Promise<any> {
        return await this.getCollection(collectionName).reIndex();
    }

    async rename(collectionName: string, newName: string, options?: { dropTarget?: boolean }): Promise<Collection> {
        return await this.getCollection(collectionName).rename(newName, options);
    }

    async replaceOne(collectionName: string, query: ObjectLiteral, doc: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return await this.getCollection(collectionName).replaceOne(query, doc, options);
    }

    async stats(collectionName: string, options?: { scale: number }): Promise<CollStats> {
        return await this.getCollection(collectionName).stats(options);
    }

    async updateMany(collectionName: string, query: ObjectLiteral, update: ObjectLiteral, options?: { upsert?: boolean, w?: any, wtimeout?: number, j?: boolean }): Promise<UpdateWriteOpResult> {
        return await this.getCollection(collectionName).updateMany(query, update, options);
    }

    async updateOne(collectionName: string, query: ObjectLiteral, update: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return await this.getCollection(collectionName).updateOne(query, update, options);
    }

    async clearDatabase(): Promise<void> {
        await this.databaseConnection.db(this.connection.driver.database!).dropDatabase();
    }

    async connect(): Promise<any> {
    }

    async release(): Promise<void> {

    }

    async startTransaction(): Promise<void> {

    }

    async commitTransaction(): Promise<void> {

    }

    async rollbackTransaction(): Promise<void> {

    }

    query(query: string, parameters?: any[]): Promise<any> {
        throw new Error(`Executing SQL query is not supported by MongoDB driver.`);
    }

    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        throw new Error(`Stream is not supported by MongoDB driver.`);
    }

    async getDatabases(): Promise<string[]> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async getSchemas(database?: string): Promise<string[]> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async getTable(collectionName: string): Promise<Table|undefined> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async getTables(collectionNames: string[]): Promise<Table[]> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async hasDatabase(database: string): Promise<boolean> {
        throw new Error(`Check database queries are not supported by MongoDB driver.`);
    }

    async hasSchema(schema: string): Promise<boolean> {
        throw new Error(`Check schema queries are not supported by MongoDB driver.`);
    }

    async hasTable(collectionName: string): Promise<boolean> {
        throw new Error(`Check schema queries are not supported by MongoDB driver.`);
    }

    async hasColumn(tableOrName: Table|string, columnName: string): Promise<boolean> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createDatabase(database: string): Promise<void> {
        throw new Error(`Database create queries are not supported by MongoDB driver.`);
    }

    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        throw new Error(`Database drop queries are not supported by MongoDB driver.`);
    }

    async createSchema(schema: string, ifNotExist?: boolean): Promise<void> {
        throw new Error(`Schema create queries are not supported by MongoDB driver.`);
    }

    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new Error(`Schema drop queries are not supported by MongoDB driver.`);
    }

    async createTable(table: Table): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropTable(tableName: Table|string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async renameTable(oldTableOrName: Table|string, newTableOrName: Table|string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async renameColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newTableColumnOrName: TableColumn|string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async changeColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async changeColumns(tableOrName: Table|string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropColumn(tableOrName: Table|string, columnOrName: TableColumn|string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createPrimaryKey(tableOrName: Table|string, columnNames: string[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async updatePrimaryKeys(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropPrimaryKey(tableOrName: Table|string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createUniqueConstraint(tableOrName: Table|string, uniqueConstraint: TableUnique): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createCheckConstraint(tableOrName: Table|string, checkConstraint: TableCheck): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropCheckConstraint(tableOrName: Table|string, checkOrName: TableCheck|string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createIndex(tableOrName: Table|string, index: TableIndex): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async createIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropIndex(collectionName: string, indexName: string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async dropIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    async clearTable(collectionName: string): Promise<void> {
        await this.databaseConnection
            .db(this.connection.driver.database!)
            .dropCollection(collectionName);
    }

    enableSqlMemory(): void {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }

    disableSqlMemory(): void {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }

    clearSqlMemory(): void {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }

    getMemorySql():  SqlInMemory {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }

    async executeMemoryUpSql(): Promise<void> {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }

    async executeMemoryDownSql(): Promise<void> {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }

    protected getCollection(collectionName: string): Collection {
        return this.databaseConnection.db(this.connection.driver.database!).collection(collectionName);
    }
}