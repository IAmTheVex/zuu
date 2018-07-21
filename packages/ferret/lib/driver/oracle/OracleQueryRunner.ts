import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {OracleDriver} from "./OracleDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {QueryFailedError} from "../../error/QueryFailedError";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";
import {OrmUtils} from "../../util/OrmUtils";
import {TableCheck} from "../../schema-builder/table/TableCheck";
import {ColumnType, PromiseUtils} from "../../index";

export class OracleQueryRunner extends BaseQueryRunner implements QueryRunner {

    driver: OracleDriver;

    protected databaseConnectionPromise: Promise<any>;

    constructor(driver: OracleDriver, mode: "master"|"slave" = "master") {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
        this.mode = mode;
    }

    connect(): Promise<any> {
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(connection => {
                this.databaseConnection = connection;
                return this.databaseConnection;
            });

        } else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(connection => {
                this.databaseConnection = connection;
                return this.databaseConnection;
            });
        }

        return this.databaseConnectionPromise;
    }

    release(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.isReleased = true;
            if (this.databaseConnection) {
                this.databaseConnection.close((err: any) => {
                    if (err)
                        return fail(err);

                    ok();
                });
            } else {
                ok();
            }
        });
    }

    async startTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        this.isTransactionActive = true;
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

        return new Promise(async (ok, fail) => {
            try {
                this.driver.connection.logger.logQuery(query, parameters, this);
                const queryStartTime = +new Date();

                const handler = (err: any, result: any) => {

                    const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                    if (err) {
                        this.driver.connection.logger.logQueryError(err, query, parameters, this);
                        return fail(new QueryFailedError(query, parameters, err));
                    }
                    ok(result.rows || result.outBinds);
                };
                const executionOptions = {
                    autoCommit: this.isTransactionActive ? false : true
                };

                const databaseConnection = await this.connect();
                databaseConnection.execute(query, parameters || {}, executionOptions, handler);

            } catch (err) {
                fail(err);
            }
        });
    }

    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        throw new Error(`Stream is not supported by Oracle driver.`);
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
        return Promise.resolve(false);
    }

    async hasTable(tableOrName: Table|string): Promise<boolean> {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const sql = `SELECT "TABLE_NAME" FROM "USER_TABLES" WHERE "TABLE_NAME" = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    async hasColumn(tableOrName: Table|string, columnName: string): Promise<boolean> {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const sql = `SELECT "COLUMN_NAME" FROM "USER_TAB_COLS" WHERE "TABLE_NAME" = '${tableName}' AND "COLUMN_NAME" = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        await this.query(`CREATE DATABASE IF NOT EXISTS "${database}"`);
    }

    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        return Promise.resolve();
    }

    async createSchema(schemas: string, ifNotExist?: boolean): Promise<void> {
        throw new Error(`Schema create queries are not supported by Oracle driver.`);
    }

    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new Error(`Schema drop queries are not supported by Oracle driver.`);
    }

    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true, createIndices: boolean = true): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        upQueries.push(this.createTableSql(table, createForeignKeys));
        downQueries.push(this.dropTableSql(table));

        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));

        if (createIndices) {
            table.indices.forEach(index => {
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                upQueries.push(this.createIndexSql(table, index));
                downQueries.push(this.dropIndexSql(index));
            });
        }

        await this.executeQueries(upQueries, downQueries);
    }

    async dropTable(tableOrName: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {// It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        if (ifExist) {
            const isTableExist = await this.hasTable(tableOrName);
            if (!isTableExist) return Promise.resolve();
        }

        const createForeignKeys: boolean = dropForeignKeys;
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const upQueries: string[] = [];
        const downQueries: string[] = [];


        if (dropIndices) {
            table.indices.forEach(index => {
                upQueries.push(this.dropIndexSql(index));
                downQueries.push(this.createIndexSql(table, index));
            });
        }

        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

        upQueries.push(this.dropTableSql(table));
        downQueries.push(this.createTableSql(table, createForeignKeys));

        await this.executeQueries(upQueries, downQueries);
    }

    async renameTable(oldTableOrName: Table|string, newTableOrName: Table|string): Promise<void> {
        const upQueries: string[] = [];
        const downQueries: string[] = [];
        const oldTable = oldTableOrName instanceof Table ? oldTableOrName : await this.getCachedTable(oldTableOrName);
        let newTable = oldTable.clone();

        if (newTableOrName instanceof Table) {
            newTable = newTableOrName;
        } else {
            newTable.name = newTableOrName;
        }

        upQueries.push(`ALTER TABLE "${oldTable.name}" RENAME TO "${newTable.name}"`);
        downQueries.push(`ALTER TABLE "${newTable.name}" RENAME TO "${oldTable.name}"`);

        if (newTable.primaryColumns.length > 0) {
            const columnNames = newTable.primaryColumns.map(column => column.name);

            const oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
            const newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);

            // build queries
            upQueries.push(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`);
            downQueries.push(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`);
        }

        newTable.uniques.forEach(unique => {
            const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);

            upQueries.push(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`);
            downQueries.push(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`);

            unique.name = newUniqueName;
        });

        newTable.indices.forEach(index => {
            const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);

            upQueries.push(`ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`);
            downQueries.push(`ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`);

            index.name = newIndexName;
        });

        newTable.foreignKeys.forEach(foreignKey => {
            const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames);

            upQueries.push(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`);
            downQueries.push(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`);

            foreignKey.name = newForeignKeyName;
        });

        await this.executeQueries(upQueries, downQueries);

        oldTable.name = newTable.name;
        this.replaceCachedTable(oldTable, newTable);
    }

    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        upQueries.push(`ALTER TABLE "${table.name}" ADD ${this.buildCreateColumnSql(column)}`);
        downQueries.push(`ALTER TABLE "${table.name}" DROP COLUMN "${column.name}"`);

        if (column.isPrimary) {
            const primaryColumns = clonedTable.primaryColumns;
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`);
                downQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            }

            primaryColumns.push(column);
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            downQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`);
        }

        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
            upQueries.push(this.createIndexSql(table, columnIndex));
            downQueries.push(this.dropIndexSql(columnIndex));
        }

        if (column.isUnique) {
            const uniqueConstraint = new TableUnique({
                name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                columnNames: [column.name]
            });
            clonedTable.uniques.push(uniqueConstraint);
            upQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`);
            downQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${uniqueConstraint.name}"`);
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

        let newColumn: TableColumn|undefined = undefined;
        if (newTableColumnOrName instanceof TableColumn) {
            newColumn = newTableColumnOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newTableColumnOrName;
        }

        await this.changeColumn(table, oldColumn, newColumn);
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

        if ((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid") || oldColumn.type !== newColumn.type || oldColumn.length !== newColumn.length) {
            await this.dropColumn(table, oldColumn);
            await this.addColumn(table, newColumn);

            clonedTable = table.clone();

        } else {
            if (newColumn.name !== oldColumn.name) {
                upQueries.push(`ALTER TABLE "${table.name}" RENAME COLUMN "${oldColumn.name}" TO "${newColumn.name}"`);
                downQueries.push(`ALTER TABLE "${table.name}" RENAME COLUMN "${newColumn.name}" TO "${oldColumn.name}"`);

                if (oldColumn.isPrimary === true) {
                    const primaryColumns = clonedTable.primaryColumns;

                    const columnNames = primaryColumns.map(column => column.name);
                    const oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                    columnNames.push(newColumn.name);

                    const newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    upQueries.push(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`);
                    downQueries.push(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`);
                }

                clonedTable.findColumnUniques(oldColumn).forEach(unique => {
                    unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                    unique.columnNames.push(newColumn.name);
                    const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);

                    upQueries.push(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`);
                    downQueries.push(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`);

                    unique.name = newUniqueName;
                });

                clonedTable.findColumnIndices(oldColumn).forEach(index => {
                    index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                    index.columnNames.push(newColumn.name);
                    const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);

                    upQueries.push(`ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`);
                    downQueries.push(`ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`);

                    index.name = newIndexName;
                });

                clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                    foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                    foreignKey.columnNames.push(newColumn.name);
                    const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames);

                    upQueries.push(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`);
                    downQueries.push(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`);

                    foreignKey.name = newForeignKeyName;
                });

                const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn!)].name = newColumn.name;
                oldColumn.name = newColumn.name;
            }

            if (this.isColumnChanged(oldColumn, newColumn, true)) {
                let defaultUp: string = "";
                let defaultDown: string = "";
                let nullableUp:  string = "";
                let nullableDown:  string = "";

                if (newColumn.default !== null && newColumn.default !== undefined) {
                    defaultUp = `DEFAULT ${newColumn.default}`;

                    if (oldColumn.default !== null && oldColumn.default !== undefined) {
                        defaultDown = `DEFAULT ${oldColumn.default}`;
                    } else {
                        defaultDown = "DEFAULT NULL";
                    }

                } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                    defaultUp = "DEFAULT NULL";
                    defaultDown = `DEFAULT ${oldColumn.default}`;
                }

                if (newColumn.isNullable !== oldColumn.isNullable) {
                    if (newColumn.isNullable === true) {
                        nullableUp = "NULL";
                        nullableDown = "NOT NULL";
                    } else {
                        nullableUp = "NOT NULL";
                        nullableDown = "NULL";
                    }
                }

                upQueries.push(`ALTER TABLE "${table.name}" MODIFY "${oldColumn.name}" ${this.connection.driver.createFullType(newColumn)} ${defaultUp} ${nullableUp}`);
                downQueries.push(`ALTER TABLE "${table.name}" MODIFY "${oldColumn.name}" ${this.connection.driver.createFullType(oldColumn)} ${defaultDown} ${nullableDown}`);
            }

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns;

                if (primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`);
                    downQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                }

                if (newColumn.isPrimary === true) {
                    primaryColumns.push(newColumn);
                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = true;
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                    downQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`);

                } else {
                    const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                    primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);

                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = false;

                    if (primaryColumns.length > 0) {
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                        downQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`);
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
                    upQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`);
                    downQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${uniqueConstraint.name}"`);

                } else {
                    const uniqueConstraint = clonedTable.uniques.find(unique => {
                        return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                    });
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint!), 1);
                    upQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${uniqueConstraint!.name}"`);
                    downQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${uniqueConstraint!.name}" UNIQUE ("${newColumn.name}")`);
                }
            }

            await this.executeQueries(upQueries, downQueries);
            this.replaceCachedTable(table, clonedTable);
        }
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
            upQueries.push(`ALTER TABLE "${clonedTable.name}" DROP CONSTRAINT "${pkName}"`);
            downQueries.push(`ALTER TABLE "${clonedTable.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);

            const tableColumn = clonedTable.findColumnByName(column.name);
            tableColumn!.isPrimary = false;

            if (clonedTable.primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                upQueries.push(`ALTER TABLE "${clonedTable.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                downQueries.push(`ALTER TABLE "${clonedTable.name}" DROP CONSTRAINT "${pkName}"`);
            }
        }

        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            upQueries.push(this.dropIndexSql(columnIndex));
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

        upQueries.push(`ALTER TABLE "${table.name}" DROP COLUMN "${column.name}"`);
        downQueries.push(`ALTER TABLE "${table.name}" ADD ${this.buildCreateColumnSql(column)}`);

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
        const columnNames = columns.map(column => column.name);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const primaryColumns = clonedTable.primaryColumns;
        if (primaryColumns.length > 0) {
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
            const columnNamesString = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`);
            downQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`);
        }

        clonedTable.columns
            .filter(column => columnNames.indexOf(column.name) !== -1)
            .forEach(column => column.isPrimary = true);

        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        upQueries.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`);
        downQueries.push(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`);

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
        const promises = uniqueConstraints.map(uniqueConstraint => this.createUniqueConstraint(tableOrName, uniqueConstraint));
        await Promise.all(promises);
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
        const promises = uniqueConstraints.map(uniqueConstraint => this.dropUniqueConstraint(tableOrName, uniqueConstraint));
        await Promise.all(promises);
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
        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableOrName, foreignKey));
        await Promise.all(promises);
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
        const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableOrName, foreignKey));
        await Promise.all(promises);
    }

    async createIndex(tableOrName: Table|string, index: TableIndex): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        if (!index.name)
            index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);

        const up = this.createIndexSql(table, index);
        const down = this.dropIndexSql(index);
        await this.executeQueries(up, down);
        table.addIndex(index);
    }

    async createIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        const promises = indices.map(index => this.createIndex(tableOrName, index));
        await Promise.all(promises);
    }

    async dropIndex(tableOrName: Table|string, indexOrName: TableIndex|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
        if (!index)
            throw new Error(`Supplied index was not found in table ${table.name}`);

        const up = this.dropIndexSql(index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(up, down);
        table.removeIndex(index);
    }

    async dropIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        const promises = indices.map(index => this.dropIndex(tableOrName, index));
        await Promise.all(promises);
    }

    async clearTable(tableName: string): Promise<void> {
        await this.query(`TRUNCATE TABLE "${tableName}"`);
    }

    async clearDatabase(): Promise<void> {
        await this.startTransaction();
        try {
            const dropTablesQuery = `SELECT 'DROP TABLE "' || TABLE_NAME || '" CASCADE CONSTRAINTS' AS "query" FROM "USER_TABLES"`;
            const dropQueries: ObjectLiteral[] = await this.query(dropTablesQuery);
            await Promise.all(dropQueries.map(query => this.query(query["query"])));
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

        const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");
        const tablesSql = `SELECT * FROM "USER_TABLES" WHERE "TABLE_NAME" IN (${tableNamesString})`;
        const columnsSql = `SELECT * FROM "USER_TAB_COLS" WHERE "TABLE_NAME" IN (${tableNamesString})`;

        const indicesSql = `SELECT "IND"."INDEX_NAME", "IND"."TABLE_NAME", "IND"."UNIQUENESS", ` +
            `LISTAGG ("COL"."COLUMN_NAME", ',') WITHIN GROUP (ORDER BY "COL"."COLUMN_NAME") AS "COLUMN_NAMES" ` +
            `FROM "USER_INDEXES" "IND" ` +
            `INNER JOIN "USER_IND_COLUMNS" "COL" ON "COL"."INDEX_NAME" = "IND"."INDEX_NAME" ` +
            `LEFT JOIN "USER_CONSTRAINTS" "CON" ON "CON"."CONSTRAINT_NAME" = "IND"."INDEX_NAME" ` +
            `WHERE "IND"."TABLE_NAME" IN (${tableNamesString}) AND "CON"."CONSTRAINT_NAME" IS NULL ` +
            `GROUP BY "IND"."INDEX_NAME", "IND"."TABLE_NAME", "IND"."UNIQUENESS"`;

        const foreignKeysSql = `SELECT "C"."CONSTRAINT_NAME", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "REF_COL"."TABLE_NAME" AS "REFERENCED_TABLE_NAME", ` +
            `"REF_COL"."COLUMN_NAME" AS "REFERENCED_COLUMN_NAME", "C"."DELETE_RULE" AS "ON_DELETE" ` +
            `FROM "USER_CONSTRAINTS" "C" ` +
            `INNER JOIN "USER_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
            `INNER JOIN "USER_CONS_COLUMNS" "REF_COL" ON "REF_COL"."OWNER" = "C"."R_OWNER" AND "REF_COL"."CONSTRAINT_NAME" = "C"."R_CONSTRAINT_NAME" AND "REF_COL"."POSITION" = "COL"."POSITION" ` +
            `WHERE "C"."TABLE_NAME" IN (${tableNamesString}) AND "C"."CONSTRAINT_TYPE" = 'R'`;

        const constraintsSql = `SELECT "C"."CONSTRAINT_NAME", "C"."CONSTRAINT_TYPE", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "C"."SEARCH_CONDITION" ` +
            `FROM "USER_CONSTRAINTS" "C" ` +
            `INNER JOIN "USER_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
            `WHERE "C"."TABLE_NAME" IN (${tableNamesString}) AND "C"."CONSTRAINT_TYPE" IN ('C', 'U', 'P') AND "C"."GENERATED" = 'USER NAME'`;

        const [dbTables, dbColumns, dbIndices, dbForeignKeys, dbConstraints]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql),
            this.query(constraintsSql),
        ]);

        if (!dbTables.length)
            return [];

        return dbTables.map(dbTable => {
            const table = new Table();
            table.name = dbTable["TABLE_NAME"];

            table.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === table.name)
                .map(dbColumn => {
                    const columnConstraints = dbConstraints.filter(dbConstraint => dbConstraint["TABLE_NAME"] === table.name && dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"]);

                    const uniqueConstraint = columnConstraints.find(constraint => constraint["CONSTRAINT_TYPE"] === "U");
                    const isConstraintComposite = uniqueConstraint
                        ? !!dbConstraints.find(dbConstraint => dbConstraint["CONSTRAINT_TYPE"] === "U"
                            && dbConstraint["CONSTRAINT_NAME"] === uniqueConstraint["CONSTRAINT_NAME"]
                            && dbConstraint["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"])
                        : false;
                    const isUnique = !!uniqueConstraint && !isConstraintComposite;

                    const isPrimary = !!columnConstraints.find(constraint =>  constraint["CONSTRAINT_TYPE"] === "P");

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();
                    if (tableColumn.type.indexOf("(") !== -1)
                        tableColumn.type = tableColumn.type.replace(/\([0-9]*\)/, "");

                    if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type as ColumnType) !== -1) {
                        const length = tableColumn.type === "raw" ? dbColumn["DATA_LENGTH"] : dbColumn["CHAR_COL_DECL_LENGTH"];
                        tableColumn.length = length && !this.isDefaultColumnLength(table, tableColumn, length) ? length.toString() : "";
                    }

                    if (tableColumn.type === "number" || tableColumn.type === "float") {
                        if (dbColumn["DATA_PRECISION"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_PRECISION"]))
                            tableColumn.precision = dbColumn["DATA_PRECISION"];
                        if (dbColumn["DATA_SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["DATA_SCALE"]))
                            tableColumn.scale = dbColumn["DATA_SCALE"];

                    } else if ((tableColumn.type === "timestamp"
                        || tableColumn.type === "timestamp with time zone"
                        || tableColumn.type === "timestamp with local time zone") && dbColumn["DATA_SCALE"] !== null) {
                        tableColumn.precision = !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_SCALE"]) ? dbColumn["DATA_SCALE"] : undefined;
                    }

                    tableColumn.default = dbColumn["DATA_DEFAULT"] !== null
                        && dbColumn["DATA_DEFAULT"] !== undefined
                        && dbColumn["DATA_DEFAULT"].trim() !== "NULL" ? tableColumn.default = dbColumn["DATA_DEFAULT"].trim() : undefined;

                    tableColumn.isNullable = dbColumn["NULLABLE"] === "Y";
                    tableColumn.isUnique = isUnique;
                    tableColumn.isPrimary = isPrimary;
                    tableColumn.isGenerated = dbColumn["IDENTITY_COLUMN"] === "YES";
                    if (tableColumn.isGenerated) {
                        tableColumn.generationStrategy = "increment";
                        tableColumn.default = undefined;
                    }
                    tableColumn.comment = ""; // todo
                    return tableColumn;
                });

            const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return dbConstraint["TABLE_NAME"] === table.name && dbConstraint["CONSTRAINT_TYPE"] === "U";
            }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);

            table.uniques = tableUniqueConstraints.map(constraint => {
                const uniques = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                return new TableUnique({
                    name: constraint["CONSTRAINT_NAME"],
                    columnNames: uniques.map(u => u["COLUMN_NAME"])
                });
            });

            const tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return dbConstraint["TABLE_NAME"] === table.name && dbConstraint["CONSTRAINT_TYPE"] === "C";
            }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);

            table.checks = tableCheckConstraints.map(constraint => {
                const checks = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                return new TableCheck({
                    name: constraint["CONSTRAINT_NAME"],
                    columnNames: checks.map(c => c["COLUMN_NAME"]),
                    expression: constraint["SEARCH_CONDITION"]
                });
            });

            const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                return dbForeignKey["TABLE_NAME"] === table.name;
            }), dbForeignKey => dbForeignKey["CONSTRAINT_NAME"]);

            table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                return new TableForeignKey({
                    name: dbForeignKey["CONSTRAINT_NAME"],
                    columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                    referencedTableName: dbForeignKey["REFERENCED_TABLE_NAME"],
                    referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                    onDelete: dbForeignKey["ON_DELETE"] === "NO ACTION" ? undefined : dbForeignKey["ON_DELETE"]
                });
            });

            table.indices = dbIndices
                .filter(dbIndex => dbIndex["TABLE_NAME"] === table.name )
                .map(dbIndex => {
                    return new TableIndex({
                        name: dbIndex["INDEX_NAME"],
                        columnNames: dbIndex["COLUMN_NAMES"].split(","),
                        isUnique: dbIndex["UNIQUENESS"] === "UNIQUE"
                    });
                });

            return table;
        });
    }

    protected createTableSql(table: Table, createForeignKeys?: boolean): string {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;

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
                let constraint = `CONSTRAINT "${fk.name}" FOREIGN KEY (${columnNames}) REFERENCES "${fk.referencedTableName}" (${referencedColumnNames})`;
                if (fk.onDelete)
                    constraint += ` ON DELETE ${fk.onDelete}`;

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

    protected dropTableSql(tableOrName: Table|string, ifExist?: boolean): string {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        return ifExist ? `DROP TABLE IF EXISTS "${tableName}"` : `DROP TABLE "${tableName}"`;
    }

    protected createIndexSql(table: Table, index: TableIndex): string {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${table.name}"(${columns})`;
    }

    protected dropIndexSql(indexOrName: TableIndex|string): string {
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return `DROP INDEX "${indexName}"`;
    }

    protected createPrimaryKeySql(table: Table, columnNames: string[]): string {
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        return `ALTER TABLE "${table.name}" ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`;
    }

    protected dropPrimaryKeySql(table: Table): string {
        const columnNames = table.primaryColumns.map(column => column.name);
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return `ALTER TABLE "${table.name}" DROP CONSTRAINT "${primaryKeyName}"`;
    }

    protected createUniqueConstraintSql(table: Table, uniqueConstraint: TableUnique): string {
        const columnNames = uniqueConstraint.columnNames.map(column => `"` + column + `"`).join(", ");
        return `ALTER TABLE "${table.name}" ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE (${columnNames})`;
    }

    protected dropUniqueConstraintSql(table: Table, uniqueOrName: TableUnique|string): string {
        const uniqueName = uniqueOrName instanceof TableUnique ? uniqueOrName.name : uniqueOrName;
        return `ALTER TABLE "${table.name}" DROP CONSTRAINT "${uniqueName}"`;
    }

    protected createCheckConstraintSql(table: Table, checkConstraint: TableCheck): string {
        return `ALTER TABLE "${table.name}" ADD CONSTRAINT "${checkConstraint.name}" CHECK (${checkConstraint.expression})`;
    }

    protected dropCheckConstraintSql(table: Table, checkOrName: TableCheck|string): string {
        const checkName = checkOrName instanceof TableCheck ? checkOrName.name : checkOrName;
        return `ALTER TABLE "${table.name}" DROP CONSTRAINT "${checkName}"`;
    }

    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): string {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE "${table.name}" ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES "${foreignKey.referencedTableName}" (${referencedColumnNames})`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;

        return sql;
    }

    protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey|string): string {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return `ALTER TABLE "${table.name}" DROP CONSTRAINT "${foreignKeyName}"`;
    }

    protected buildCreateColumnSql(column: TableColumn) {
        let c = `"${column.name}" ` + this.connection.driver.createFullType(column);
        if (column.charset)
            c += " CHARACTER SET " + column.charset;
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.default !== undefined && column.default !== null) // DEFAULT must be placed before NOT NULL
            c += " DEFAULT " + column.default;
        if (column.isNullable !== true && !column.isGenerated) // NOT NULL is not supported with GENERATED
            c += " NOT NULL";
        if (column.isGenerated === true && column.generationStrategy === "increment")
            c += " GENERATED ALWAYS AS IDENTITY";

        return c;
    }
}