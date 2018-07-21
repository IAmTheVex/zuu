import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {PostgresDriver} from "./PostgresDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {QueryFailedError} from "../../error/QueryFailedError";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {TableIndexOptions} from "../../schema-builder/options/TableIndexOptions";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";
import {OrmUtils} from "../../util/OrmUtils";
import {PromiseUtils} from "../../";
import {TableCheck} from "../../schema-builder/table/TableCheck";
import {ColumnType} from "../../index";

export class PostgresQueryRunner extends BaseQueryRunner implements QueryRunner {
    driver: PostgresDriver;

    protected databaseConnectionPromise: Promise<any>;

    protected releaseCallback: Function;

    constructor(driver: PostgresDriver, mode: "master"|"slave" = "master") {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.mode = mode;
        this.broadcaster = new Broadcaster(this);
    }

    connect(): Promise<any> {
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        if (this.mode === "slave" && this.driver.isReplicated)  {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(([ connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });

        } else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(([connection, release]: any[]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });
        }

        return this.databaseConnectionPromise;
    }

    release(): Promise<void> {
        this.isReleased = true;
        if (this.releaseCallback)
            this.releaseCallback();

        const index = this.driver.connectedQueryRunners.indexOf(this);
        if (index !== -1) this.driver.connectedQueryRunners.splice(index);

        return Promise.resolve();
    }

    async startTransaction(): Promise<void> {
        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        this.isTransactionActive = true;
        await this.query("START TRANSACTION");
    }

    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("COMMIT");
        this.isTransactionActive = false;
    }

    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("ROLLBACK");
        this.isTransactionActive = false;
    }

    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise<any[]>(async (ok, fail) => {
            try {
                const databaseConnection = await this.connect();
                this.driver.connection.logger.logQuery(query, parameters, this);
                const queryStartTime = +new Date();

                databaseConnection.query(query, parameters, (err: any, result: any) => {

                    const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                    if (err) {
                        this.driver.connection.logger.logQueryError(err, query, parameters, this);
                        fail(new QueryFailedError(query, parameters, err));
                    } else {
                        ok(result.rows);
                    }
                });

            } catch (err) {
                fail(err);
            }
        });
    }

    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        const QueryStream = this.driver.loadStreamDependency();
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            try {
                const databaseConnection = await this.connect();
                this.driver.connection.logger.logQuery(query, parameters, this);
                const stream = databaseConnection.query(new QueryStream(query, parameters));
                if (onEnd) stream.on("end", onEnd);
                if (onError) stream.on("error", onError);
                ok(stream);

            } catch (err) {
                fail(err);
            }
        });
    }

    async getDatabases(): Promise<string[]> {
        return Promise.resolve([]);
    }

    async getSchemas(database?: string): Promise<string[]> {
        return Promise.resolve([]);
    }

    async hasDatabase(database: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    async hasSchema(schema: string): Promise<boolean> {
        const result = await this.query(`SELECT * FROM "information_schema"."schemata" WHERE "schema_name" = '${schema}'`);
        return result.length ? true : false;
    }

    async hasTable(tableOrName: Table|string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableOrName);
        const sql = `SELECT * FROM "information_schema"."tables" WHERE "table_schema" = ${parsedTableName.schema} AND "table_name" = ${parsedTableName.tableName}`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    async hasColumn(tableOrName: Table|string, columnName: string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableOrName);
        const sql = `SELECT * FROM "information_schema"."columns" WHERE "table_schema" = ${parsedTableName.schema} AND "table_name" = ${parsedTableName.tableName} AND "column_name" = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        await Promise.resolve();
    }

    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        return Promise.resolve();
    }

    async createSchema(schema: string, ifNotExist?: boolean): Promise<void> {
        const up = ifNotExist ? `CREATE SCHEMA IF NOT EXISTS "${schema}"` : `CREATE SCHEMA "${schema}"`;
        const down = `DROP SCHEMA "${schema}" CASCADE`;
        await this.executeQueries(up, down);
    }

    async dropSchema(schemaPath: string, ifExist?: boolean, isCascade?: boolean): Promise<void> {
        const schema = schemaPath.indexOf(".") === -1 ? schemaPath : schemaPath.split(".")[0];
        const up = ifExist ? `DROP SCHEMA IF EXISTS "${schema}" ${isCascade ? "CASCADE" : ""}` : `DROP SCHEMA "${schema}" ${isCascade ? "CASCADE" : ""}`;
        const down = `CREATE SCHEMA "${schema}"`;
        await this.executeQueries(up, down);
    }

    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true, createIndices: boolean = true): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        await Promise.all(table.columns
            .filter(column => column.type === "enum")
            .map(async column => {
                const hasEnum = await this.hasEnumType(table, column);
                if (!hasEnum) {
                    upQueries.push(this.createEnumTypeSql(table, column));
                    downQueries.push(this.dropEnumTypeSql(table, column));
                }
                return Promise.resolve();
            }));

        upQueries.push(this.createTableSql(table, createForeignKeys));
        downQueries.push(this.dropTableSql(table));

        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));

        if (createIndices) {
            table.indices.forEach(index => {

                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                upQueries.push(this.createIndexSql(table, index));
                downQueries.push(this.dropIndexSql(table, index));
            });
        }

        await this.executeQueries(upQueries, downQueries);
    }

    async dropTable(target: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {// It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        if (ifExist) {
            const isTableExist = await this.hasTable(target);
            if (!isTableExist) return Promise.resolve();
        }

        const createForeignKeys: boolean = dropForeignKeys;
        const tableName = target instanceof Table ? target.name : target;
        const table = await this.getCachedTable(tableName);
        const upQueries: string[] = [];
        const downQueries: string[] = [];


        if (dropIndices) {
            table.indices.forEach(index => {
                upQueries.push(this.dropIndexSql(table, index));
                downQueries.push(this.createIndexSql(table, index));
            });
        }

        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

        upQueries.push(this.dropTableSql(table));
        downQueries.push(this.createTableSql(table, createForeignKeys));

        await this.executeQueries(upQueries, downQueries);
    }

    async renameTable(oldTableOrName: Table|string, newTableName: string): Promise<void> {
        const upQueries: string[] = [];
        const downQueries: string[] = [];
        const oldTable = oldTableOrName instanceof Table ? oldTableOrName : await this.getCachedTable(oldTableOrName);
        const newTable = oldTable.clone();
        const oldTableName = oldTable.name.indexOf(".") === -1 ? oldTable.name : oldTable.name.split(".")[1];
        const schemaName = oldTable.name.indexOf(".") === -1 ? undefined : oldTable.name.split(".")[0];
        newTable.name = schemaName ? `${schemaName}.${newTableName}` : newTableName;

        upQueries.push(`ALTER TABLE ${this.escapeTableName(oldTable)} RENAME TO "${newTableName}"`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME TO "${oldTableName}"`);

        if (newTable.primaryColumns.length > 0) {
            const columnNames = newTable.primaryColumns.map(column => column.name);

            const oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
            const newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);

            upQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`);
        }

        newTable.uniques.forEach(unique => {
            const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);

            upQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`);

            unique.name = newUniqueName;
        });

        newTable.indices.forEach(index => {
            const schema = this.extractSchema(newTable);
            const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);

            const up = schema ? `ALTER INDEX "${schema}"."${index.name}" RENAME TO "${newIndexName}"` : `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`;
            const down = schema ? `ALTER INDEX "${schema}"."${newIndexName}" RENAME TO "${index.name}"` : `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`;
            upQueries.push(up);
            downQueries.push(down);

            index.name = newIndexName;
        });

        newTable.foreignKeys.forEach(foreignKey => {
            const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames);

            upQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`);

            foreignKey.name = newForeignKeyName;
        });

        newTable.columns
            .filter(column => column.type === "enum")
            .forEach(column => {
                upQueries.push(`ALTER TYPE ${this.buildEnumName(oldTable, column)} RENAME TO ${this.buildEnumName(newTable, column, false)}`);
                downQueries.push(`ALTER TYPE ${this.buildEnumName(newTable, column)} RENAME TO ${this.buildEnumName(oldTable, column, false)}`);
            });

        await this.executeQueries(upQueries, downQueries);
    }

    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        if (column.type === "enum") {
            const hasEnum = await this.hasEnumType(table, column);
            if (!hasEnum) {
                upQueries.push(this.createEnumTypeSql(table, column));
                downQueries.push(this.dropEnumTypeSql(table, column));
            }
        }

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(table, column)}`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);

        if (column.isPrimary) {
            const primaryColumns = clonedTable.primaryColumns;
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            }

            primaryColumns.push(column);
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
        }

        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            upQueries.push(this.createIndexSql(table, columnIndex));
            downQueries.push(this.dropIndexSql(table, columnIndex));
        }

        if (column.isUnique) {
            const uniqueConstraint = new TableUnique({
                name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                columnNames: [column.name]
            });
            clonedTable.uniques.push(uniqueConstraint);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);
        }

        await this.executeQueries(upQueries, downQueries);

        clonedTable.addColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        await PromiseUtils.runInSequence(columns, column => this.addColumn(tableOrName, column));
    }

    async renameColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newTableColumnOrName: TableColumn|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        let newColumn;
        if (newTableColumnOrName instanceof TableColumn) {
            newColumn = newTableColumnOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newTableColumnOrName;
        }

        return this.changeColumn(table, oldColumn, newColumn);
    }

    async changeColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        let clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const oldColumn = oldTableColumnOrName instanceof TableColumn
            ? oldTableColumnOrName
            : table.columns.find(column => column.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        if (oldColumn.type !== newColumn.type || oldColumn.length !== newColumn.length) {
            await this.dropColumn(table, oldColumn);
            await this.addColumn(table, newColumn);

            clonedTable = table.clone();

        } else {
            if (oldColumn.name !== newColumn.name) {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME COLUMN "${oldColumn.name}" TO "${newColumn.name}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME COLUMN "${newColumn.name}" TO "${oldColumn.name}"`);

                if (oldColumn.type === "enum") {
                    upQueries.push(`ALTER TYPE ${this.buildEnumName(table, oldColumn)} RENAME TO ${this.buildEnumName(table, newColumn, false)}`);
                    downQueries.push(`ALTER TYPE ${this.buildEnumName(table, newColumn)} RENAME TO ${this.buildEnumName(table, oldColumn, false)}`);
                }

                if (oldColumn.isPrimary === true) {
                    const primaryColumns = clonedTable.primaryColumns;

                    const columnNames = primaryColumns.map(column => column.name);
                    const oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                    columnNames.push(newColumn.name);

                    const newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`);
                }

                if (oldColumn.isGenerated === true && newColumn.generationStrategy === "increment") {
                    const schema = this.extractSchema(table);

                    const seqName = this.buildSequenceName(table, oldColumn.name, undefined, true, true);
                    const newSeqName = this.buildSequenceName(table, newColumn.name, undefined, true, true);

                    const up = schema ? `ALTER SEQUENCE "${schema}"."${seqName}" RENAME TO "${newSeqName}"` : `ALTER SEQUENCE "${seqName}" RENAME TO "${newSeqName}"`;
                    const down = schema ? `ALTER SEQUENCE "${schema}"."${newSeqName}" RENAME TO "${seqName}"` : `ALTER SEQUENCE "${newSeqName}" RENAME TO "${seqName}"`;
                    upQueries.push(up);
                    downQueries.push(down);
                }

                clonedTable.findColumnUniques(oldColumn).forEach(unique => {
                    unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                    unique.columnNames.push(newColumn.name);
                    const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);

                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`);

                    unique.name = newUniqueName;
                });

                clonedTable.findColumnIndices(oldColumn).forEach(index => {
                    index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                    index.columnNames.push(newColumn.name);
                    const schema = this.extractSchema(table);
                    const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);

                    const up = schema ? `ALTER INDEX "${schema}"."${index.name}" RENAME TO "${newIndexName}"` : `ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`;
                    const down = schema ? `ALTER INDEX "${schema}"."${newIndexName}" RENAME TO "${index.name}"` : `ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`;
                    upQueries.push(up);
                    downQueries.push(down);

                    index.name = newIndexName;
                });

                clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                    foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                    foreignKey.columnNames.push(newColumn.name);
                    const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames);

                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`);

                    foreignKey.name = newForeignKeyName;
                });

                const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn!)].name = newColumn.name;
                oldColumn.name = newColumn.name;
            }

            if (newColumn.precision !== oldColumn.precision || newColumn.scale !== oldColumn.scale) {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(newColumn)}`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${this.driver.createFullType(oldColumn)}`);
            }

            if (newColumn.type === "enum" && oldColumn.type === "enum" && !OrmUtils.isArraysEqual(newColumn.enum!, oldColumn.enum!)) {
                const enumName = this.buildEnumName(table, newColumn);
                const enumNameWithoutSchema = this.buildEnumName(table, newColumn, false);
                const oldEnumName = this.buildEnumName(table, newColumn, true, false, true);
                const oldEnumNameWithoutSchema = this.buildEnumName(table, newColumn, false, false, true);

                upQueries.push(`ALTER TYPE ${enumName} RENAME TO ${oldEnumNameWithoutSchema}`);
                downQueries.push(`ALTER TYPE ${oldEnumName} RENAME TO ${enumNameWithoutSchema}`);

                upQueries.push(this.createEnumTypeSql(table, newColumn));
                downQueries.push(this.dropEnumTypeSql(table, oldColumn));

                if (newColumn.default !== null && newColumn.default !== undefined) {
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`);
                }

                const upType = `${enumNameWithoutSchema} USING "${newColumn.name}"::"text"::${enumNameWithoutSchema}`;
                const downType = `${oldEnumNameWithoutSchema} USING "${newColumn.name}"::"text"::${oldEnumNameWithoutSchema}`;

                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${upType}`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" TYPE ${downType}`);

                if (newColumn.default !== null && newColumn.default !== undefined) {
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
                }

                upQueries.push(this.dropEnumTypeSql(table, newColumn, oldEnumName));
                downQueries.push(this.createEnumTypeSql(table, oldColumn, oldEnumName));
            }

            if (oldColumn.isNullable !== newColumn.isNullable) {
                if (newColumn.isNullable) {
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`);
                } else {
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" SET NOT NULL`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${oldColumn.name}" DROP NOT NULL`);
                }
            }

            if (oldColumn.comment !== newColumn.comment) {
                upQueries.push(`COMMENT ON COLUMN ${this.escapeTableName(table)}."${oldColumn.name}" IS '${newColumn.comment}'`);
                downQueries.push(`COMMENT ON COLUMN ${this.escapeTableName(table)}."${newColumn.name}" IS '${oldColumn.comment}'`);
            }

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns;

                if (primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                }

                if (newColumn.isPrimary === true) {
                    primaryColumns.push(newColumn);
                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = true;
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);

                } else {
                    const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                    primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);

                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = false;

                    if (primaryColumns.length > 0) {
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
                    }
                }
            }

            if (newColumn.isUnique !== oldColumn.isUnique) {
                if (newColumn.isUnique === true) {
                    const uniqueConstraint = new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table.name, [newColumn.name]),
                        columnNames: [newColumn.name]
                    });
                    clonedTable.uniques.push(uniqueConstraint);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);

                } else {
                    const uniqueConstraint = clonedTable.uniques.find(unique => {
                        return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                    });
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint!), 1);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint!.name}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint!.name}" UNIQUE ("${newColumn.name}")`);
                }
            }

            if (oldColumn.isGenerated !== newColumn.isGenerated && newColumn.generationStrategy !== "uuid") {
                if (newColumn.isGenerated === true) {
                    upQueries.push(`CREATE SEQUENCE ${this.buildSequenceName(table, newColumn)} OWNED BY ${this.escapeTableName(table)}."${newColumn.name}"`);
                    downQueries.push(`DROP SEQUENCE ${this.buildSequenceName(table, newColumn)}`);

                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT nextval('${this.buildSequenceName(table, newColumn, undefined, true)}')`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);

                } else {
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT nextval('${this.buildSequenceName(table, newColumn, undefined, true)}')`);

                    upQueries.push(`DROP SEQUENCE ${this.buildSequenceName(table, newColumn)}`);
                    downQueries.push(`CREATE SEQUENCE ${this.buildSequenceName(table, newColumn)} OWNED BY ${this.escapeTableName(table)}."${newColumn.name}"`);
                }
            }

            if (newColumn.default !== oldColumn.default) {
                if (newColumn.default !== null && newColumn.default !== undefined) {
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${newColumn.default}`);

                    if (oldColumn.default !== null && oldColumn.default !== undefined) {
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`);
                    } else {
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
                    }

                } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" DROP DEFAULT`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN "${newColumn.name}" SET DEFAULT ${oldColumn.default}`);
                }
            }
        }

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(table, clonedTable);
    }

    async changeColumns(tableOrName: Table|string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        await PromiseUtils.runInSequence(changedColumns, changedColumn => this.changeColumn(tableOrName, changedColumn.oldColumn, changedColumn.newColumn));
    }

    async dropColumn(tableOrName: Table|string, columnOrName: TableColumn|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
        if (!column)
            throw new Error(`Column "${columnOrName}" was not found in table "${table.name}"`);

        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        if (column.isPrimary) {
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
            const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${pkName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);

            const tableColumn = clonedTable.findColumnByName(column.name);
            tableColumn!.isPrimary = false;

            if (clonedTable.primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${pkName}"`);
            }
        }

        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
            upQueries.push(this.dropIndexSql(table, columnIndex));
            downQueries.push(this.createIndexSql(table, columnIndex));
        }

        const columnCheck = clonedTable.checks.find(check => !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name);
        if (columnCheck) {
            clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
            upQueries.push(this.dropCheckConstraintSql(table, columnCheck));
            downQueries.push(this.createCheckConstraintSql(table, columnCheck));
        }

        const columnUnique = clonedTable.uniques.find(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
        if (columnUnique) {
            clonedTable.uniques.splice(clonedTable.uniques.indexOf(columnUnique), 1);
            upQueries.push(this.dropUniqueConstraintSql(table, columnUnique));
            downQueries.push(this.createUniqueConstraintSql(table, columnUnique));
        }

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(table, column)}`);

        if (column.type === "enum") {
            const hasEnum = await this.hasEnumType(table, column);
            if (hasEnum) {
                upQueries.push(this.dropEnumTypeSql(table, column));
                downQueries.push(this.createEnumTypeSql(table, column));
            }
        }

        await this.executeQueries(upQueries, downQueries);

        clonedTable.removeColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    async dropColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        await PromiseUtils.runInSequence(columns, column => this.dropColumn(tableOrName, column));
    }

    async createPrimaryKey(tableOrName: Table|string, columnNames: string[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();

        const up = this.createPrimaryKeySql(table, columnNames);

        clonedTable.columns.forEach(column => {
            if (columnNames.find(columnName => columnName === column.name))
                column.isPrimary = true;
        });
        const down = this.dropPrimaryKeySql(clonedTable);

        await this.executeQueries(up, down);
        this.replaceCachedTable(table, clonedTable);
    }

    async updatePrimaryKeys(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const columnNames = columns.map(column => column.name);
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const primaryColumns = clonedTable.primaryColumns;
        if (primaryColumns.length > 0) {
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
            const columnNamesString = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`);
        }

        clonedTable.columns
            .filter(column => columnNames.indexOf(column.name) !== -1)
            .forEach(column => column.isPrimary = true);

        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(table, clonedTable);
    }

    async dropPrimaryKey(tableOrName: Table|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const up = this.dropPrimaryKeySql(table);
        const down = this.createPrimaryKeySql(table, table.primaryColumns.map(column => column.name));
        await this.executeQueries(up, down);
        table.primaryColumns.forEach(column => {
            column.isPrimary = false;
        });
    }

    async createUniqueConstraint(tableOrName: Table|string, uniqueConstraint: TableUnique): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        if (!uniqueConstraint.name)
            uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table.name, uniqueConstraint.columnNames);

        const up = this.createUniqueConstraintSql(table, uniqueConstraint);
        const down = this.dropUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.addUniqueConstraint(uniqueConstraint);
    }

    async createUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        await PromiseUtils.runInSequence(uniqueConstraints, uniqueConstraint => this.createUniqueConstraint(tableOrName, uniqueConstraint));
    }

    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
        if (!uniqueConstraint)
            throw new Error(`Supplied unique constraint was not found in table ${table.name}`);

        const up = this.dropUniqueConstraintSql(table, uniqueConstraint);
        const down = this.createUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.removeUniqueConstraint(uniqueConstraint);
    }

    async dropUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        await PromiseUtils.runInSequence(uniqueConstraints, uniqueConstraint => this.dropUniqueConstraint(tableOrName, uniqueConstraint));
    }

    async createCheckConstraint(tableOrName: Table|string, checkConstraint: TableCheck): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        if (!checkConstraint.name)
            checkConstraint.name = this.connection.namingStrategy.checkConstraintName(table.name, checkConstraint.expression!);

        const up = this.createCheckConstraintSql(table, checkConstraint);
        const down = this.dropCheckConstraintSql(table, checkConstraint);
        await this.executeQueries(up, down);
        table.addCheckConstraint(checkConstraint);
    }

    async createCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        const promises = checkConstraints.map(checkConstraint => this.createCheckConstraint(tableOrName, checkConstraint));
        await Promise.all(promises);
    }

    async dropCheckConstraint(tableOrName: Table|string, checkOrName: TableCheck|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(c => c.name === checkOrName);
        if (!checkConstraint)
            throw new Error(`Supplied check constraint was not found in table ${table.name}`);

        const up = this.dropCheckConstraintSql(table, checkConstraint);
        const down = this.createCheckConstraintSql(table, checkConstraint);
        await this.executeQueries(up, down);
        table.removeCheckConstraint(checkConstraint);
    }

    async dropCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        const promises = checkConstraints.map(checkConstraint => this.dropCheckConstraint(tableOrName, checkConstraint));
        await Promise.all(promises);
    }

    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        if (!foreignKey.name)
            foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames);

        const up = this.createForeignKeySql(table, foreignKey);
        const down = this.dropForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.addForeignKey(foreignKey);
    }

    async createForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        await PromiseUtils.runInSequence(foreignKeys, foreignKey => this.createForeignKey(tableOrName, foreignKey));
    }

    async dropForeignKey(tableOrName: Table|string, foreignKeyOrName: TableForeignKey|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
        if (!foreignKey)
            throw new Error(`Supplied foreign key was not found in table ${table.name}`);

        const up = this.dropForeignKeySql(table, foreignKey);
        const down = this.createForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.removeForeignKey(foreignKey);
    }

    async dropForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        await PromiseUtils.runInSequence(foreignKeys, foreignKey => this.dropForeignKey(tableOrName, foreignKey));
    }

    async createIndex(tableOrName: Table|string, index: TableIndex): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        if (!index.name)
            index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);

        const up = this.createIndexSql(table, index);
        const down = this.dropIndexSql(table, index);
        await this.executeQueries(up, down);
        table.addIndex(index);
    }

    async createIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        await PromiseUtils.runInSequence(indices, index => this.createIndex(tableOrName, index));
    }

    async dropIndex(tableOrName: Table|string, indexOrName: TableIndex|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
        if (!index)
            throw new Error(`Supplied index was not found in table ${table.name}`);

        const up = this.dropIndexSql(table, index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(up, down);
        table.removeIndex(index);
    }

    async dropIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        await PromiseUtils.runInSequence(indices, index => this.dropIndex(tableOrName, index));
    }

    async clearTable(tableName: string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapeTableName(tableName)}`);
    }

    async clearDatabase(): Promise<void> {
        const schemas: string[] = [];
        this.connection.entityMetadatas
            .filter(metadata => metadata.schema)
            .forEach(metadata => {
                const isSchemaExist = !!schemas.find(schema => schema === metadata.schema);
                if (!isSchemaExist)
                    schemas.push(metadata.schema!);
            });
        schemas.push(this.driver.options.schema || "current_schema()");
        const schemaNamesString = schemas.map(name => {
            return name === "current_schema()" ? name : "'" + name + "'";
        }).join(", ");

        await this.startTransaction();
        try {
            const selectDropsQuery = `SELECT 'DROP TABLE IF EXISTS "' || schemaname || '"."' || tablename || '" CASCADE;' as "query" FROM "pg_tables" WHERE "schemaname" IN (${schemaNamesString})`;
            const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
            await Promise.all(dropQueries.map(q => this.query(q["query"])));
            await this.dropEnumTypes(schemaNamesString);

            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;
        }
    }

    protected async loadTables(tableNames: string[]): Promise<Table[]> {

        if (!tableNames || !tableNames.length)
            return [];

        const currentSchemaQuery = await this.query(`SELECT * FROM current_schema()`);
        const currentSchema = currentSchemaQuery[0]["current_schema"];

        const tablesCondition = tableNames.map(tableName => {
            let [schema, name] = tableName.split(".");
            if (!name) {
                name = schema;
                schema = this.driver.options.schema || currentSchema;
            }
            return `("table_schema" = '${schema}' AND "table_name" = '${name}')`;
        }).join(" OR ");
        const tablesSql = `SELECT * FROM "information_schema"."tables" WHERE ` + tablesCondition;
        const columnsSql = `SELECT *, "udt_name"::"regtype" AS "regtype" FROM "information_schema"."columns" WHERE ` + tablesCondition;

        const constraintsCondition = tableNames.map(tableName => {
            let [schema, name] = tableName.split(".");
            if (!name) {
                name = schema;
                schema = this.driver.options.schema || currentSchema;
            }
            return `("ns"."nspname" = '${schema}' AND "t"."relname" = '${name}')`;
        }).join(" OR ");

        const constraintsSql = `SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "cnst"."conname" AS "constraint_name", "cnst"."conlib" AS "expression", ` +
            `CASE "cnst"."contype" WHEN 'p' THEN 'PRIMARY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' END AS "constraint_type", "a"."attname" AS "column_name" ` +
            `FROM "pg_constraint" "cnst" ` +
            `INNER JOIN "pg_class" "t" ON "t"."oid" = "cnst"."conrelid" ` +
            `INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "cnst"."connamespace" ` +
            `INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "cnst"."conrelid" AND "a"."attnum" = ANY ("cnst"."conkey") ` +
            `WHERE "t"."relkind" = 'r' AND (${constraintsCondition})`;

        const indicesSql = `SELECT "ns"."nspname" AS "table_schema", "t"."relname" AS "table_name", "i"."relname" AS "constraint_name", "a"."attname" AS "column_name", ` +
            `CASE "ix"."indisunique" WHEN 't' THEN 'TRUE' ELSE'FALSE' END AS "is_unique", pg_get_expr("ix"."indpred", "ix"."indrelid") AS "condition" ` +
            `FROM "pg_class" "t" ` +
            `INNER JOIN "pg_index" "ix" ON "ix"."indrelid" = "t"."oid" ` +
            `INNER JOIN "pg_attribute" "a" ON "a"."attrelid" = "t"."oid"  AND "a"."attnum" = ANY ("ix"."indkey") ` +
            `INNER JOIN "pg_namespace" "ns" ON "ns"."oid" = "t"."relnamespace" ` +
            `INNER JOIN "pg_class" "i" ON "i"."oid" = "ix"."indexrelid" ` +
            `LEFT JOIN "pg_constraint" "cnst" ON "cnst"."conname" = "i"."relname" ` +
            `WHERE "t"."relkind" = 'r' AND "cnst"."contype" IS NULL AND (${constraintsCondition})`;

        const foreignKeysCondition = tableNames.map(tableName => {
            let [schema, name] = tableName.split(".");
            if (!name) {
                name = schema;
                schema = this.driver.options.schema || currentSchema;
            }
            return `("ns"."nspname" = '${schema}' AND "cl"."relname" = '${name}')`;
        }).join(" OR ");
        const foreignKeysSql = `SELECT "con"."conname" AS "constraint_name", "con"."nspname" AS "table_schema", "con"."relname" AS "table_name", "att2"."attname" AS "column_name", ` +
            `"ns"."nspname" AS "referenced_table_schema", "cl"."relname" AS "referenced_table_name", "att"."attname" AS "referenced_column_name", "con"."confdeltype" AS "on_delete", "con"."confupdtype" AS "on_update" ` +
            `FROM ( ` +
            `SELECT UNNEST ("con1"."conkey") AS "parent", UNNEST ("con1"."confkey") AS "child", "con1"."confrelid", "con1"."conrelid", "con1"."conname", "con1"."contype", "ns"."nspname", "cl"."relname", ` +
            `CASE "con1"."confdeltype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confdeltype", ` +
            `CASE "con1"."confupdtype" WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END as "confupdtype" ` +
            `FROM "pg_class" "cl" ` +
            `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
            `INNER JOIN "pg_constraint" "con1" ON "con1"."conrelid" = "cl"."oid" ` +
            `WHERE "con1"."contype" = 'f' AND (${foreignKeysCondition}) ` +
            `) "con" ` +
            `INNER JOIN "pg_attribute" "att" ON "att"."attrelid" = "con"."confrelid" AND "att"."attnum" = "con"."child" ` +
            `INNER JOIN "pg_class" "cl" ON "cl"."oid" = "con"."confrelid" ` +
            `INNER JOIN "pg_namespace" "ns" ON "cl"."relnamespace" = "ns"."oid" ` +
            `INNER JOIN "pg_attribute" "att2" ON "att2"."attrelid" = "con"."conrelid" AND "att2"."attnum" = "con"."parent"`;
        const [dbTables, dbColumns, dbConstraints, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(constraintsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql),
        ]);

        if (!dbTables.length)
            return [];

        return Promise.all(dbTables.map(async dbTable => {
            const table = new Table();

            const schema = dbTable["table_schema"] === currentSchema && !this.driver.options.schema ? undefined : dbTable["table_schema"];
            table.name = this.driver.buildTableName(dbTable["table_name"], schema);
            const tableFullName = this.driver.buildTableName(dbTable["table_name"], dbTable["table_schema"]);

            table.columns = await Promise.all(dbColumns
                .filter(dbColumn => this.driver.buildTableName(dbColumn["table_name"], dbColumn["table_schema"]) === tableFullName)
                .map(async dbColumn => {

                    const columnConstraints = dbConstraints.filter(dbConstraint => {
                        return this.driver.buildTableName(dbConstraint["table_name"], dbConstraint["table_schema"]) === tableFullName && dbConstraint["column_name"] === dbColumn["column_name"];
                    });

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["column_name"];
                    tableColumn.type = dbColumn["regtype"].toLowerCase();

                    if (tableColumn.type === "numeric" || tableColumn.type === "decimal" || tableColumn.type === "float") {
                        if (dbColumn["numeric_precision"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["numeric_precision"])) {
                            tableColumn.precision = dbColumn["numeric_precision"];
                        } else if (dbColumn["numeric_scale"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["numeric_scale"])) {
                            tableColumn.precision = undefined;
                        }
                        if (dbColumn["numeric_scale"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["numeric_scale"])) {
                            tableColumn.scale = dbColumn["numeric_scale"];
                        } else if (dbColumn["numeric_precision"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["numeric_precision"])) {
                            tableColumn.scale = undefined;
                        }
                    }

                    if (dbColumn["data_type"].toLowerCase() === "array") {
                        tableColumn.isArray = true;
                        const type = tableColumn.type.replace("[]", "");
                        tableColumn.type = this.connection.driver.normalizeType({type: type});
                    }

                    if (tableColumn.type === "interval"
                        || tableColumn.type === "time without time zone"
                        || tableColumn.type === "time with time zone"
                        || tableColumn.type === "timestamp without time zone"
                        || tableColumn.type === "timestamp with time zone") {
                        tableColumn.precision = !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["datetime_precision"]) ? dbColumn["datetime_precision"] : undefined;
                    }

                    if (tableColumn.type.indexOf("enum") !== -1) {
                        tableColumn.type = "enum";
                        const sql = `SELECT "e"."enumlabel" AS "value" FROM "pg_enum" "e" ` +
                            `INNER JOIN "pg_type" "t" ON "t"."oid" = "e"."enumtypid" ` +
                            `INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" ` +
                            `WHERE "n"."nspname" = '${dbTable["table_schema"]}' AND "t"."typname" = '${this.buildEnumName(table, tableColumn.name, false, true)}'`;
                        const results: ObjectLiteral[] = await this.query(sql);
                        tableColumn.enum = results.map(result => result["value"]);
                    }

                    if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type as ColumnType) !== -1 && dbColumn["character_maximum_length"]) {
                        const length = dbColumn["character_maximum_length"].toString();
                        tableColumn.length = !this.isDefaultColumnLength(table, tableColumn, length) ? length : "";
                    }
                    tableColumn.isNullable = dbColumn["is_nullable"] === "YES";
                    tableColumn.isPrimary = !!columnConstraints.find(constraint => constraint["constraint_type"] === "PRIMARY");

                    const uniqueConstraint = columnConstraints.find(constraint => constraint["constraint_type"] === "UNIQUE");
                    const isConstraintComposite = uniqueConstraint
                        ? !!dbConstraints.find(dbConstraint => dbConstraint["constraint_type"] === "UNIQUE"
                            && dbConstraint["constraint_name"] === uniqueConstraint["constraint_name"]
                            && dbConstraint["column_name"] !== dbColumn["column_name"])
                        : false;
                    tableColumn.isUnique = !!uniqueConstraint && !isConstraintComposite;

                    if (dbColumn["column_default"] !== null && dbColumn["column_default"] !== undefined) {
                        if (dbColumn["column_default"].replace(/"/gi, "") === `nextval('${this.buildSequenceName(table, dbColumn["column_name"], currentSchema, true)}'::regclass)`) {
                            tableColumn.isGenerated = true;
                            tableColumn.generationStrategy = "increment";

                        } else if (/^uuid_generate_v\d\(\)/.test(dbColumn["column_default"])) {
                            tableColumn.isGenerated = true;
                            tableColumn.generationStrategy = "uuid";

                        } else {
                            tableColumn.default = dbColumn["column_default"].replace(/::.*/, "");
                        }
                    }

                    tableColumn.comment = ""; // dbColumn["COLUMN_COMMENT"];
                    if (dbColumn["character_set_name"])
                        tableColumn.charset = dbColumn["character_set_name"];
                    if (dbColumn["collation_name"])
                        tableColumn.collation = dbColumn["collation_name"];
                    return tableColumn;
                }));

            const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return this.driver.buildTableName(dbConstraint["table_name"], dbConstraint["table_schema"]) === tableFullName
                    && dbConstraint["constraint_type"] === "UNIQUE";
            }), dbConstraint => dbConstraint["constraint_name"]);

            table.uniques = tableUniqueConstraints.map(constraint => {
                const uniques = dbConstraints.filter(dbC => dbC["constraint_name"] === constraint["constraint_name"]);
                return new TableUnique({
                    name: constraint["constraint_name"],
                    columnNames: uniques.map(u => u["column_name"])
                });
            });

            const tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return this.driver.buildTableName(dbConstraint["table_name"], dbConstraint["table_schema"]) === tableFullName
                    && dbConstraint["constraint_type"] === "CHECK";
            }), dbConstraint => dbConstraint["constraint_name"]);

            table.checks = tableCheckConstraints.map(constraint => {
                const checks = dbConstraints.filter(dbC => dbC["constraint_name"] === constraint["constraint_name"]);
                return new TableCheck({
                    name: constraint["constraint_name"],
                    columnNames: checks.map(c => c["column_name"]),
                    expression: constraint["expression"] // column names are not escaped, may cause problems
                });
            });

            const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                return this.driver.buildTableName(dbForeignKey["table_name"], dbForeignKey["table_schema"]) === tableFullName;
            }), dbForeignKey => dbForeignKey["constraint_name"]);

            table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["constraint_name"] === dbForeignKey["constraint_name"]);

                const schema = dbForeignKey["referenced_table_schema"] === currentSchema ? undefined : dbTable["referenced_table_schema"];
                const referencedTableName = this.driver.buildTableName(dbForeignKey["referenced_table_name"], schema);

                return new TableForeignKey({
                    name: dbForeignKey["constraint_name"],
                    columnNames: foreignKeys.map(dbFk => dbFk["column_name"]),
                    referencedTableName: referencedTableName,
                    referencedColumnNames: foreignKeys.map(dbFk => dbFk["referenced_column_name"]),
                    onDelete: dbForeignKey["on_delete"],
                    onUpdate: dbForeignKey["on_update"]
                });
            });

            const tableIndexConstraints = OrmUtils.uniq(dbIndices.filter(dbIndex => {
                return this.driver.buildTableName(dbIndex["table_name"], dbIndex["table_schema"]) === tableFullName;
            }), dbIndex => dbIndex["constraint_name"]);

            table.indices = tableIndexConstraints.map(constraint => {
                const indices = dbIndices.filter(index => index["constraint_name"] === constraint["constraint_name"]);
                return new TableIndex(<TableIndexOptions>{
                    table: table,
                    name: constraint["constraint_name"],
                    columnNames: indices.map(i => i["column_name"]),
                    isUnique: constraint["is_unique"] === "TRUE",
                    where: constraint["condition"],
                    isSpatial: false,
                    isFulltext: false
                });
            });

            return table;
        }));
    }

    protected createTableSql(table: Table, createForeignKeys?: boolean): string {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(table, column)).join(", ");
        let sql = `CREATE TABLE ${this.escapeTableName(table)} (${columnDefinitions}`;

        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
                const isUniqueExist = table.uniques.some(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
                if (!isUniqueExist)
                    table.uniques.push(new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                        columnNames: [column.name]
                    }));
            });

        if (table.uniques.length > 0) {
            const uniquesSql = table.uniques.map(unique => {
                const uniqueName = unique.name ? unique.name : this.connection.namingStrategy.uniqueConstraintName(table.name, unique.columnNames);
                const columnNames = unique.columnNames.map(columnName => `"${columnName}"`).join(", ");
                return `CONSTRAINT "${uniqueName}" UNIQUE (${columnNames})`;
            }).join(", ");

            sql += `, ${uniquesSql}`;
        }

        if (table.checks.length > 0) {
            const checksSql = table.checks.map(check => {
                const checkName = check.name ? check.name : this.connection.namingStrategy.checkConstraintName(table.name, check.expression!);
                return `CONSTRAINT "${checkName}" CHECK (${check.expression})`;
            }).join(", ");

            sql += `, ${checksSql}`;
        }

        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `"${columnName}"`).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `"${columnName}"`).join(", ");

                let constraint = `CONSTRAINT "${fk.name}" FOREIGN KEY (${columnNames}) REFERENCES ${this.escapeTableName(fk.referencedTableName)} (${referencedColumnNames})`;
                if (fk.onDelete)
                    constraint += ` ON DELETE ${fk.onDelete}`;
                if (fk.onUpdate)
                    constraint += ` ON UPDATE ${fk.onUpdate}`;

                return constraint;
            }).join(", ");

            sql += `, ${foreignKeysSql}`;
        }

        const primaryColumns = table.columns.filter(column => column.isPrimary);
        if (primaryColumns.length > 0) {
            const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            sql += `, CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNames})`;
        }

        sql += `)`;

        return sql;
    }

    protected extractSchema(target: Table|string): string|undefined {
        const tableName = target instanceof Table ? target.name : target;
        return tableName.indexOf(".") === -1 ? this.driver.options.schema : tableName.split(".")[0];
    }

    protected async dropEnumTypes(schemaNames: string): Promise<void> {
        const selectDropsQuery = `SELECT 'DROP TYPE IF EXISTS "' || n.nspname || '"."' || t.typname || '" CASCADE;' as "query" FROM "pg_type" "t" ` +
            `INNER JOIN "pg_enum" "e" ON "e"."enumtypid" = "t"."oid" ` +
            `INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" ` +
            `WHERE "n"."nspname" IN (${schemaNames}) GROUP BY "n"."nspname", "t"."typname"`;
        const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
        await Promise.all(dropQueries.map(q => this.query(q["query"])));
    }

    protected async hasEnumType(table: Table, column: TableColumn): Promise<boolean> {
        const schema = this.parseTableName(table).schema;
        const enumName = this.buildEnumName(table, column, false, true);
        const sql = `SELECT "n"."nspname", "t"."typname" FROM "pg_type" "t" ` +
            `INNER JOIN "pg_namespace" "n" ON "n"."oid" = "t"."typnamespace" ` +
            `WHERE "n"."nspname" = ${schema} AND "t"."typname" = '${enumName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    protected createEnumTypeSql(table: Table, column: TableColumn, enumName?: string): string {
        if (!enumName)
            enumName = this.buildEnumName(table, column);
        const enumValues = column.enum!.map(value => `'${value}'`).join(", ");
        return `CREATE TYPE ${enumName} AS ENUM(${enumValues})`;
    }

    protected dropEnumTypeSql(table: Table, column: TableColumn, enumName?: string): string {
        if (!enumName)
            enumName = this.buildEnumName(table, column);
        return `DROP TYPE ${enumName}`;
    }

    protected dropTableSql(tableOrPath: Table|string): string {
        return `DROP TABLE ${this.escapeTableName(tableOrPath)}`;
    }

    protected createIndexSql(table: Table, index: TableIndex): string {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON ${this.escapeTableName(table)}(${columns}) ${index.where ? "WHERE " + index.where : ""}`;
    }

    protected dropIndexSql(table: Table, indexOrName: TableIndex|string): string {
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        const schema = this.extractSchema(table);
        return schema ? `DROP INDEX "${schema}"."${indexName}"` : `DROP INDEX "${indexName}"`;
    }

    protected createPrimaryKeySql(table: Table, columnNames: string[]): string {
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`;
    }

    protected dropPrimaryKeySql(table: Table): string {
        const columnNames = table.primaryColumns.map(column => column.name);
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${primaryKeyName}"`;
    }

    protected createUniqueConstraintSql(table: Table, uniqueConstraint: TableUnique): string {
        const columnNames = uniqueConstraint.columnNames.map(column => `"` + column + `"`).join(", ");
        return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE (${columnNames})`;
    }

    protected dropUniqueConstraintSql(table: Table, uniqueOrName: TableUnique|string): string {
        const uniqueName = uniqueOrName instanceof TableUnique ? uniqueOrName.name : uniqueOrName;
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueName}"`;
    }

    protected createCheckConstraintSql(table: Table, checkConstraint: TableCheck): string {
        return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${checkConstraint.name}" CHECK (${checkConstraint.expression})`;
    }

    protected dropCheckConstraintSql(table: Table, checkOrName: TableCheck|string): string {
        const checkName = checkOrName instanceof TableCheck ? checkOrName.name : checkOrName;
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${checkName}"`;
    }

    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): string {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        if (foreignKey.onUpdate)
            sql += ` ON UPDATE ${foreignKey.onUpdate}`;

        return sql;
    }

    protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey|string): string {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${foreignKeyName}"`;
    }

    protected buildSequenceName(table: Table, columnOrName: TableColumn|string, currentSchema?: string, disableEscape?: true, skipSchema?: boolean): string {
        const columnName = columnOrName instanceof TableColumn ? columnOrName.name : columnOrName;
        let schema: string|undefined = undefined;
        let tableName: string|undefined = undefined;

        if (table.name.indexOf(".") === -1) {
            tableName = table.name;
        } else {
            schema = table.name.split(".")[0];
            tableName = table.name.split(".")[1];
        }

        if (schema && schema !== currentSchema && !skipSchema) {
            return disableEscape ? `${schema}.${tableName}_${columnName}_seq` : `"${schema}"."${tableName}_${columnName}_seq"`;

        } else {
            return disableEscape ? `${tableName}_${columnName}_seq` : `"${tableName}_${columnName}_seq"`;
        }
    }

    protected buildEnumName(table: Table, columnOrName: TableColumn|string, withSchema: boolean = true, disableEscape?: boolean, toOld?: boolean): string {
        const columnName = columnOrName instanceof TableColumn ? columnOrName.name : columnOrName;
        const schema = table.name.indexOf(".") === -1 ? this.driver.options.schema : table.name.split(".")[0];
        const tableName = table.name.indexOf(".") === -1 ? table.name : table.name.split(".")[1];
        let enumName = schema && withSchema ? `${schema}.${tableName}_${columnName.toLowerCase()}_enum` : `${tableName}_${columnName.toLowerCase()}_enum`;
        if (toOld)
            enumName = enumName + "_old";
        return enumName.split(".").map(i => {
            return disableEscape ? i : `"${i}"`;
        }).join(".");
    }

    protected escapeTableName(target: Table|string, disableEscape?: boolean): string {
        let tableName = target instanceof Table ? target.name : target;
        tableName = tableName.indexOf(".") === -1 && this.driver.options.schema ? `${this.driver.options.schema}.${tableName}` : tableName;

        return tableName.split(".").map(i => {
            return disableEscape ? i : `"${i}"`;
        }).join(".");
    }

    protected parseTableName(target: Table|string) {
        const tableName = target instanceof Table ? target.name : target;
        if (tableName.indexOf(".") === -1) {
            return {
                schema: this.driver.options.schema ? `'${this.driver.options.schema}'` : "current_schema()",
                tableName: `'${tableName}'`
            };
        } else {
            return {
                schema: `'${tableName.split(".")[0]}'`,
                tableName: `'${tableName.split(".")[1]}'`
            };
        }
    }

    protected buildCreateColumnSql(table: Table, column: TableColumn) {
        let c = "\"" + column.name + "\"";
        if (column.isGenerated === true && column.generationStrategy !== "uuid") {
            if (column.type === "integer" || column.type === "int" || column.type === "int4")
                c += " SERIAL";
            if (column.type === "smallint" || column.type === "int2")
                c += " SMALLSERIAL";
            if (column.type === "bigint" || column.type === "int8")
                c += " BIGSERIAL";
        }
        if (column.type === "enum") {
            c += " " + this.buildEnumName(table, column, false);
            if (column.isArray)
                c += " array";

        } else if (!column.isGenerated || column.type === "uuid") {
            c += " " + this.connection.driver.createFullType(column);
        }
        if (column.charset)
            c += " CHARACTER SET \"" + column.charset + "\"";
        if (column.collation)
            c += " COLLATE \"" + column.collation + "\"";
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.default !== undefined && column.default !== null)
            c += " DEFAULT " + column.default;
        if (column.isGenerated && column.generationStrategy === "uuid" && !column.default)
            c += " DEFAULT uuid_generate_v4()";

        return c;
    }
}
