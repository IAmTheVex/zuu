import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {MysqlDriver} from "./MysqlDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {OrmUtils} from "../../util/OrmUtils";
import {QueryFailedError} from "../../error/QueryFailedError";
import {TableIndexOptions} from "../../schema-builder/options/TableIndexOptions";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {ColumnType, PromiseUtils} from "../../index";
import {TableCheck} from "../../schema-builder/table/TableCheck";

export class MysqlQueryRunner extends BaseQueryRunner implements QueryRunner {
    driver: MysqlDriver;

    protected databaseConnectionPromise: Promise<any>;

    constructor(driver: MysqlDriver, mode: "master"|"slave" = "master") {
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
        this.isReleased = true;
        if (this.databaseConnection)
            this.databaseConnection.release();
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

        return new Promise(async (ok, fail) => {
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
                        return fail(new QueryFailedError(query, parameters, err));
                    }

                    ok(result);
                });

            } catch (err) {
                fail(err);
            }
        });
    }

    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            try {
                const databaseConnection = await this.connect();
                this.driver.connection.logger.logQuery(query, parameters, this);
                const stream = databaseConnection.query(query, parameters);
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
        throw new Error(`MySql driver does not support table schemas`);
    }

    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(`SELECT * FROM \`INFORMATION_SCHEMA\`.\`SCHEMATA\` WHERE \`SCHEMA_NAME\` = '${database}'`);
        return result.length ? true : false;
    }

    async hasSchema(schema: string): Promise<boolean> {
        throw new Error(`MySql driver does not support table schemas`);
    }

    async hasTable(tableOrName: Table|string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableOrName);
        const sql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_SCHEMA\` = '${parsedTableName.database}' AND \`TABLE_NAME\` = '${parsedTableName.tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    async hasColumn(tableOrName: Table|string, column: TableColumn|string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableOrName);
        const columnName = column instanceof TableColumn ? column.name : column;
        const sql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_SCHEMA\` = '${parsedTableName.database}' AND \`TABLE_NAME\` = '${parsedTableName.tableName}' AND \`COLUMN_NAME\` = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        const up = ifNotExist ? `CREATE DATABASE IF NOT EXISTS \`${database}\`` : `CREATE DATABASE \`${database}\``;
        const down = `DROP DATABASE \`${database}\``;
        await this.executeQueries(up, down);
    }

    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        const up = ifExist ? `DROP DATABASE IF EXISTS \`${database}\`` : `DROP DATABASE \`${database}\``;
        const down = `CREATE DATABASE \`${database}\``;
        await this.executeQueries(up, down);
    }

    async createSchema(schema: string, ifNotExist?: boolean): Promise<void> {
        throw new Error(`Schema create queries are not supported by MySql driver.`);
    }

    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new Error(`Schema drop queries are not supported by MySql driver.`);
    }

    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        upQueries.push(this.createTableSql(table, createForeignKeys));
        downQueries.push(this.dropTableSql(table));

        table.indices.forEach(index => downQueries.push(this.dropIndexSql(table, index)));

        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));

        return this.executeQueries(upQueries, downQueries);
    }

    async dropTable(target: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true): Promise<void> {
        if (ifExist) {
            const isTableExist = await this.hasTable(target);
            if (!isTableExist) return Promise.resolve();
        }

        const createForeignKeys: boolean = dropForeignKeys;
        const tableName = target instanceof Table ? target.name : target;
        const table = await this.getCachedTable(tableName);
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

        table.indices.forEach(index => upQueries.push(this.dropIndexSql(table, index)));

        upQueries.push(this.dropTableSql(table));
        downQueries.push(this.createTableSql(table, createForeignKeys));

        await this.executeQueries(upQueries, downQueries);
    }

    async renameTable(oldTableOrName: Table|string, newTableName: string): Promise<void> {
        const upQueries: string[] = [];
        const downQueries: string[] = [];
        const oldTable = oldTableOrName instanceof Table ? oldTableOrName : await this.getCachedTable(oldTableOrName);
        const newTable = oldTable.clone();
        const dbName = oldTable.name.indexOf(".") === -1 ? undefined : oldTable.name.split(".")[0];
        newTable.name = dbName ? `${dbName}.${newTableName}` : newTableName;

        upQueries.push(`RENAME TABLE ${this.escapeTableName(oldTable.name)} TO ${this.escapeTableName(newTable.name)}`);
        downQueries.push(`RENAME TABLE ${this.escapeTableName(newTable.name)} TO ${this.escapeTableName(oldTable.name)}`);

        newTable.indices.forEach(index => {
            const columnNames = index.columnNames.map(column => `\`${column}\``).join(", ");
            const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);

            let indexType = "";
            if (index.isUnique)
                indexType += "UNIQUE ";
            if (index.isSpatial)
                indexType += "SPATIAL ";
            if (index.isFulltext)
                indexType += "FULLTEXT ";
            upQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} DROP INDEX \`${index.name}\`, ADD ${indexType}INDEX \`${newIndexName}\` (${columnNames})`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(newTable)} DROP INDEX \`${newIndexName}\`, ADD ${indexType}INDEX \`${index.name}\` (${columnNames})`);

            index.name = newIndexName;
        });

        newTable.foreignKeys.forEach(foreignKey => {
            const columnNames = foreignKey.columnNames.map(column => `\`${column}\``).join(", ");
            const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `\`${column}\``).join(",");
            const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames);

            let up = `ALTER TABLE ${this.escapeTableName(newTable)} DROP FOREIGN KEY \`${foreignKey.name}\`, ADD CONSTRAINT \`${newForeignKeyName}\` FOREIGN KEY (${columnNames}) ` +
                `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
            if (foreignKey.onDelete)
                up += ` ON DELETE ${foreignKey.onDelete}`;
            if (foreignKey.onUpdate)
                up += ` ON UPDATE ${foreignKey.onUpdate}`;

            let down = `ALTER TABLE ${this.escapeTableName(newTable)} DROP FOREIGN KEY \`${newForeignKeyName}\`, ADD CONSTRAINT \`${foreignKey.name}\` FOREIGN KEY (${columnNames}) ` +
                `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
            if (foreignKey.onDelete)
                down += ` ON DELETE ${foreignKey.onDelete}`;
            if (foreignKey.onUpdate)
                down += ` ON UPDATE ${foreignKey.onUpdate}`;

            upQueries.push(up);
            downQueries.push(down);

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
        const skipColumnLevelPrimary = clonedTable.primaryColumns.length > 0;

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(column, skipColumnLevelPrimary, false)}`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN \`${column.name}\``);

        if (column.isPrimary && skipColumnLevelPrimary) {
            const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
            if (generatedColumn) {
                const nonGeneratedColumn = generatedColumn.clone();
                nonGeneratedColumn.isGenerated = false;
                nonGeneratedColumn.generationStrategy = undefined;
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${column.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(column, true)}`);
            }

            const primaryColumns = clonedTable.primaryColumns;
            let columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);

            primaryColumns.push(column);
            columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);

            if (generatedColumn) {
                const nonGeneratedColumn = generatedColumn.clone();
                nonGeneratedColumn.isGenerated = false;
                nonGeneratedColumn.generationStrategy = undefined;
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(column, true)}`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${column.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
            }
        }

        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            upQueries.push(this.createIndexSql(table, columnIndex));
            downQueries.push(this.dropIndexSql(table, columnIndex));

        } else if (column.isUnique) {
            const uniqueIndex = new TableIndex({
                name: this.connection.namingStrategy.indexName(table.name, [column.name]),
                columnNames: [column.name],
                isUnique: true
            });
            clonedTable.indices.push(uniqueIndex);
            clonedTable.uniques.push(new TableUnique({
                name: uniqueIndex.name,
                columnNames: uniqueIndex.columnNames
            }));
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD UNIQUE INDEX \`${uniqueIndex.name}\` (\`${column.name}\`)`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${uniqueIndex.name}\``);
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

    async changeColumn(tableOrName: Table|string, oldColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        let clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const oldColumn = oldColumnOrName instanceof TableColumn
            ? oldColumnOrName
            : table.columns.find(column => column.name === oldColumnOrName);
        if (!oldColumn)
            throw new Error(`Column "${oldColumnOrName}" was not found in the "${table.name}" table.`);

        if ((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid")
            || oldColumn.type !== newColumn.type
            || oldColumn.length !== newColumn.length
            || oldColumn.generatedType !== newColumn.generatedType) {
            await this.dropColumn(table, oldColumn);
            await this.addColumn(table, newColumn);

            clonedTable = table.clone();

        } else {
            if (newColumn.name !== oldColumn.name) {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${oldColumn.name}\` \`${newColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true, true)}`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${newColumn.name}\` \`${oldColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true, true)}`);

                clonedTable.findColumnIndices(oldColumn).forEach(index => {
                    index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                    index.columnNames.push(newColumn.name);
                    const columnNames = index.columnNames.map(column => `\`${column}\``).join(", ");
                    const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);

                    let indexType = "";
                    if (index.isUnique)
                        indexType += "UNIQUE ";
                    if (index.isSpatial)
                        indexType += "SPATIAL ";
                    if (index.isFulltext)
                        indexType += "FULLTEXT ";
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${index.name}\`, ADD ${indexType}INDEX \`${newIndexName}\` (${columnNames})`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${newIndexName}\`, ADD ${indexType}INDEX \`${index.name}\` (${columnNames})`);

                    index.name = newIndexName;
                });

                clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                    foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                    foreignKey.columnNames.push(newColumn.name);
                    const columnNames = foreignKey.columnNames.map(column => `\`${column}\``).join(", ");
                    const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `\`${column}\``).join(",");
                    const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames);

                    let up = `ALTER TABLE ${this.escapeTableName(table)} DROP FOREIGN KEY \`${foreignKey.name}\`, ADD CONSTRAINT \`${newForeignKeyName}\` FOREIGN KEY (${columnNames}) ` +
                        `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
                    if (foreignKey.onDelete)
                        up += ` ON DELETE ${foreignKey.onDelete}`;
                    if (foreignKey.onUpdate)
                        up += ` ON UPDATE ${foreignKey.onUpdate}`;

                    let down = `ALTER TABLE ${this.escapeTableName(table)} DROP FOREIGN KEY \`${newForeignKeyName}\`, ADD CONSTRAINT \`${foreignKey.name}\` FOREIGN KEY (${columnNames}) ` +
                        `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
                    if (foreignKey.onDelete)
                        down += ` ON DELETE ${foreignKey.onDelete}`;
                    if (foreignKey.onUpdate)
                        down += ` ON UPDATE ${foreignKey.onUpdate}`;

                    upQueries.push(up);
                    downQueries.push(down);

                    foreignKey.name = newForeignKeyName;
                });

                const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn!)].name = newColumn.name;
                oldColumn.name = newColumn.name;
            }

            if (this.isColumnChanged(oldColumn, newColumn, true)) {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, true)}`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${newColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true)}`);
            }

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
                if (generatedColumn) {
                    const nonGeneratedColumn = generatedColumn.clone();
                    nonGeneratedColumn.isGenerated = false;
                    nonGeneratedColumn.generationStrategy = undefined;

                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`);
                }

                const primaryColumns = clonedTable.primaryColumns;

                if (primaryColumns.length > 0) {
                    const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                }

                if (newColumn.isPrimary === true) {
                    primaryColumns.push(newColumn);
                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = true;
                    const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);

                } else {
                    const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                    primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);
                    const column = clonedTable.columns.find(column => column.name === newColumn.name);
                    column!.isPrimary = false;

                    if (primaryColumns.length > 0) {
                        const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                    }
                }

                if (generatedColumn) {
                    const nonGeneratedColumn = generatedColumn.clone();
                    nonGeneratedColumn.isGenerated = false;
                    nonGeneratedColumn.generationStrategy = undefined;

                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
                }
            }

            if (newColumn.isUnique !== oldColumn.isUnique) {
                if (newColumn.isUnique === true) {
                    const uniqueIndex = new TableIndex({
                        name: this.connection.namingStrategy.indexName(table.name, [newColumn.name]),
                        columnNames: [newColumn.name],
                        isUnique: true
                    });
                    clonedTable.indices.push(uniqueIndex);
                    clonedTable.uniques.push(new TableUnique({
                        name: uniqueIndex.name,
                        columnNames: uniqueIndex.columnNames
                    }));
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD UNIQUE INDEX \`${uniqueIndex.name}\` (\`${newColumn.name}\`)`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${uniqueIndex.name}\``);

                } else {
                    const uniqueIndex = clonedTable.indices.find(index => {
                        return index.columnNames.length === 1 && index.isUnique === true && !!index.columnNames.find(columnName => columnName === newColumn.name);
                    });
                    clonedTable.indices.splice(clonedTable.indices.indexOf(uniqueIndex!), 1);

                    const tableUnique = clonedTable.uniques.find(unique => unique.name === uniqueIndex!.name);
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(tableUnique!), 1);

                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${uniqueIndex!.name}\``);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD UNIQUE INDEX \`${uniqueIndex!.name}\` (\`${newColumn.name}\`)`);
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
            const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
            if (generatedColumn) {
                const nonGeneratedColumn = generatedColumn.clone();
                nonGeneratedColumn.isGenerated = false;
                nonGeneratedColumn.generationStrategy = undefined;

                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`);
            }

            const columnNames = clonedTable.primaryColumns.map(primaryColumn => `\`${primaryColumn.name}\``).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP PRIMARY KEY`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD PRIMARY KEY (${columnNames})`);

            const tableColumn = clonedTable.findColumnByName(column.name);
            tableColumn!.isPrimary = false;

            if (clonedTable.primaryColumns.length > 0) {
                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `\`${primaryColumn.name}\``).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD PRIMARY KEY (${columnNames})`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP PRIMARY KEY`);
            }

            if (generatedColumn && generatedColumn.name !== column.name) {
                const nonGeneratedColumn = generatedColumn.clone();
                nonGeneratedColumn.isGenerated = false;
                nonGeneratedColumn.generationStrategy = undefined;

                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
            }
        }

        const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
        if (columnIndex) {
            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
            upQueries.push(this.dropIndexSql(table, columnIndex));
            downQueries.push(this.createIndexSql(table, columnIndex));

        } else if (column.isUnique) {
            const uniqueName = this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]);
            const foundUnique = clonedTable.uniques.find(unique => unique.name === uniqueName);
            if (foundUnique)
                clonedTable.uniques.splice(clonedTable.uniques.indexOf(foundUnique), 1);

            const indexName = this.connection.namingStrategy.indexName(table.name, [column.name]);
            const foundIndex = clonedTable.indices.find(index => index.name === indexName);
            if (foundIndex)
                clonedTable.indices.splice(clonedTable.indices.indexOf(foundIndex), 1);

            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP INDEX \`${indexName}\``);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD UNIQUE INDEX \`${indexName}\` (\`${column.name}\`)`);
        }

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN \`${column.name}\``);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(column, true)}`);

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
        const down = this.dropPrimaryKeySql(table);

        await this.executeQueries(up, down);
        clonedTable.columns.forEach(column => {
            if (columnNames.find(columnName => columnName === column.name))
                column.isPrimary = true;
        });
        this.replaceCachedTable(table, clonedTable);
    }

    async updatePrimaryKeys(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const columnNames = columns.map(column => column.name);
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
        if (generatedColumn) {
            const nonGeneratedColumn = generatedColumn.clone();
            nonGeneratedColumn.isGenerated = false;
            nonGeneratedColumn.generationStrategy = undefined;

            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`);
        }

        const primaryColumns = clonedTable.primaryColumns;
        if (primaryColumns.length > 0) {
            const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
        }

        clonedTable.columns
            .filter(column => columnNames.indexOf(column.name) !== -1)
            .forEach(column => column.isPrimary = true);

        const columnNamesString = columnNames.map(columnName => `\`${columnName}\``).join(", ");
        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNamesString})`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);

        const newOrExistGeneratedColumn = generatedColumn ? generatedColumn : columns.find(column => column.isGenerated && column.generationStrategy === "increment");
        if (newOrExistGeneratedColumn) {
            const nonGeneratedColumn = newOrExistGeneratedColumn.clone();
            nonGeneratedColumn.isGenerated = false;
            nonGeneratedColumn.generationStrategy = undefined;

            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(newOrExistGeneratedColumn, true)}`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${newOrExistGeneratedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);

            const changedGeneratedColumn = clonedTable.columns.find(column => column.name === newOrExistGeneratedColumn.name);
            changedGeneratedColumn!.isGenerated = true;
            changedGeneratedColumn!.generationStrategy = "increment";
        }

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
        throw new Error(`MySql does not support unique constraints. Use unique index instead.`);
    }

    async createUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        throw new Error(`MySql does not support unique constraints. Use unique index instead.`);
    }

    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        throw new Error(`MySql does not support unique constraints. Use unique index instead.`);
    }

    async dropUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        throw new Error(`MySql does not support unique constraints. Use unique index instead.`);
    }

    async createCheckConstraint(tableOrName: Table|string, checkConstraint: TableCheck): Promise<void> {
        throw new Error(`MySql does not support check constraints.`);
    }

    async createCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        throw new Error(`MySql does not support check constraints.`);
    }

    async dropCheckConstraint(tableOrName: Table|string, checkOrName: TableCheck|string): Promise<void> {
        throw new Error(`MySql does not support check constraints.`);
    }

    async dropCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        throw new Error(`MySql does not support check constraints.`);
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
        const down = this.dropIndexSql(table, index);
        await this.executeQueries(up, down);
        table.addIndex(index, true);
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

        const up = this.dropIndexSql(table, index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(up, down);
        table.removeIndex(index, true);
    }

    async dropIndices(tableOrName: Table|string, indices: TableIndex[]): Promise<void> {
        const promises = indices.map(index => this.dropIndex(tableOrName, index));
        await Promise.all(promises);
    }

    async clearTable(tableOrName: Table|string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapeTableName(tableOrName)}`);
    }

    async clearDatabase(database?: string): Promise<void> {
        const dbName = database ? database : this.driver.database;
        if (dbName) {
            const isDatabaseExist = await this.hasDatabase(dbName);
            if (!isDatabaseExist)
                return Promise.resolve();
        } else {
            throw new Error(`Can not clear database. No database is specified`);
        }

        await this.startTransaction();
        try {
            const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
            const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS \`', table_schema, '\`.\`', table_name, '\`') AS \`query\` FROM \`INFORMATION_SCHEMA\`.\`TABLES\` WHERE \`TABLE_SCHEMA\` = '${dbName}'`;
            const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;

            await this.query(disableForeignKeysCheckQuery);
            const dropQueries: ObjectLiteral[] = await this.query(dropTablesQuery);
            await Promise.all(dropQueries.map(query => this.query(query["query"])));
            await this.query(enableForeignKeysCheckQuery);

            await this.commitTransaction();

        } catch (error) {
            try { 
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;
        }
    }

    protected async getCurrentDatabase(): Promise<string> {
        const currentDBQuery = await this.query(`SELECT DATABASE() AS \`db_name\``);
        return currentDBQuery[0]["db_name"];
    }

    protected async loadTables(tableNames: string[]): Promise<Table[]> {

        if (!tableNames || !tableNames.length)
            return [];

        const currentDatabase = await this.getCurrentDatabase();
        const tablesCondition = tableNames.map(tableName => {
            let [database, name] = tableName.split(".");
            if (!name) {
                name = database;
                database = this.driver.database || currentDatabase;
            }
            return `(\`TABLE_SCHEMA\` = '${database}' AND \`TABLE_NAME\` = '${name}')`;
        }).join(" OR ");
        const tablesSql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`TABLES\` WHERE ` + tablesCondition;
        
        const columnsSql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE ` + tablesCondition;

        const primaryKeySql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`KEY_COLUMN_USAGE\` WHERE \`CONSTRAINT_NAME\` = 'PRIMARY' AND (${tablesCondition})`;

        const collationsSql = `SELECT \`SCHEMA_NAME\`, \`DEFAULT_CHARACTER_SET_NAME\` as \`CHARSET\`, \`DEFAULT_COLLATION_NAME\` AS \`COLLATION\` FROM \`INFORMATION_SCHEMA\`.\`SCHEMATA\``;

        const indicesCondition = tableNames.map(tableName => {
            let [database, name] = tableName.split(".");
            if (!name) {
                name = database;
                database = this.driver.database || currentDatabase;
            }
            return `(\`s\`.\`TABLE_SCHEMA\` = '${database}' AND \`s\`.\`TABLE_NAME\` = '${name}')`;
        }).join(" OR ");
        const indicesSql = `SELECT \`s\`.* FROM \`INFORMATION_SCHEMA\`.\`STATISTICS\` \`s\` ` +
            `LEFT JOIN \`INFORMATION_SCHEMA\`.\`REFERENTIAL_CONSTRAINTS\` \`rc\` ON \`s\`.\`INDEX_NAME\` = \`rc\`.\`CONSTRAINT_NAME\` ` +
            `WHERE (${indicesCondition}) AND \`s\`.\`INDEX_NAME\` != 'PRIMARY' AND \`rc\`.\`CONSTRAINT_NAME\` IS NULL`;

        const foreignKeysCondition = tableNames.map(tableName => {
            let [database, name] = tableName.split(".");
            if (!name) {
                name = database;
                database = this.driver.database || currentDatabase;
            }
            return `(\`kcu\`.\`TABLE_SCHEMA\` = '${database}' AND \`kcu\`.\`TABLE_NAME\` = '${name}')`;
        }).join(" OR ");
        const foreignKeysSql = `SELECT \`kcu\`.\`TABLE_SCHEMA\`, \`kcu\`.\`TABLE_NAME\`, \`kcu\`.\`CONSTRAINT_NAME\`, \`kcu\`.\`COLUMN_NAME\`, \`kcu\`.\`REFERENCED_TABLE_SCHEMA\`, ` +
            `\`kcu\`.\`REFERENCED_TABLE_NAME\`, \`kcu\`.\`REFERENCED_COLUMN_NAME\`, \`rc\`.\`DELETE_RULE\` \`ON_DELETE\`, \`rc\`.\`UPDATE_RULE\` \`ON_UPDATE\` ` +
            `FROM \`INFORMATION_SCHEMA\`.\`KEY_COLUMN_USAGE\` \`kcu\` ` +
            `INNER JOIN \`INFORMATION_SCHEMA\`.\`REFERENTIAL_CONSTRAINTS\` \`rc\` ON \`rc\`.\`constraint_name\` = \`kcu\`.\`constraint_name\` ` +
            `WHERE ` + foreignKeysCondition;
        const [dbTables, dbColumns, dbPrimaryKeys, dbCollations, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(primaryKeySql),
            this.query(collationsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql)
        ]);

        if (!dbTables.length)
            return [];

        const isMariaDb = this.driver.options.type === "mariadb";

        return Promise.all(dbTables.map(async dbTable => {
            const table = new Table();

            const dbCollation = dbCollations.find(coll => coll["SCHEMA_NAME"] === dbTable["TABLE_SCHEMA"])!;
            const defaultCollation = dbCollation["COLLATION"];
            const defaultCharset = dbCollation["CHARSET"];

            const db = dbTable["TABLE_SCHEMA"] === currentDatabase ? undefined : dbTable["TABLE_SCHEMA"];
            table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], undefined, db);
            const tableFullName = this.driver.buildTableName(dbTable["TABLE_NAME"], undefined, dbTable["TABLE_SCHEMA"]);

            table.columns = dbColumns
                .filter(dbColumn => this.driver.buildTableName(dbColumn["TABLE_NAME"], undefined, dbColumn["TABLE_SCHEMA"]) === tableFullName)
                .map(dbColumn => {

                    const columnUniqueIndex = dbIndices.find(dbIndex => {
                        return this.driver.buildTableName(dbIndex["TABLE_NAME"], undefined, dbIndex["TABLE_SCHEMA"]) === tableFullName
                            && dbIndex["COLUMN_NAME"] === dbColumn["COLUMN_NAME"] && dbIndex["NON_UNIQUE"] === "0";
                    });

                    const tableMetadata = this.connection.entityMetadatas.find(metadata => metadata.tablePath === table.name);
                    const hasIgnoredIndex = columnUniqueIndex && tableMetadata && tableMetadata.indices
                        .some(index => index.name === columnUniqueIndex["INDEX_NAME"] && index.synchronize === false);

                    const isConstraintComposite = columnUniqueIndex
                        ? !!dbIndices.find(dbIndex => dbIndex["INDEX_NAME"] === columnUniqueIndex["INDEX_NAME"] && dbIndex["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"])
                        : false;

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();

                    if (this.driver.withWidthColumnTypes.indexOf(tableColumn.type as ColumnType) !== -1) {
                        const width = dbColumn["COLUMN_TYPE"].substring(dbColumn["COLUMN_TYPE"].indexOf("(") + 1, dbColumn["COLUMN_TYPE"].indexOf(")"));
                        tableColumn.width = width && !this.isDefaultColumnWidth(table, tableColumn, parseInt(width)) ? parseInt(width) : undefined;
                    }

                    if (dbColumn["COLUMN_DEFAULT"] === null
                        || dbColumn["COLUMN_DEFAULT"] === undefined
                        || (isMariaDb && dbColumn["COLUMN_DEFAULT"] === "NULL")) {
                        tableColumn.default = undefined;

                    } else {
                        tableColumn.default = dbColumn["COLUMN_DEFAULT"] === "CURRENT_TIMESTAMP" ? dbColumn["COLUMN_DEFAULT"] : `'${dbColumn["COLUMN_DEFAULT"]}'`;
                    }

                    if (dbColumn["EXTRA"].indexOf("on update") !== -1) {
                        tableColumn.onUpdate = dbColumn["EXTRA"].substring(10);
                    }

                    if (dbColumn["GENERATION_EXPRESSION"]) {
                        tableColumn.asExpression = dbColumn["GENERATION_EXPRESSION"];
                        tableColumn.generatedType = dbColumn["EXTRA"].indexOf("VIRTUAL") !== -1 ? "VIRTUAL" : "STORED";
                    }

                    tableColumn.isUnique = !!columnUniqueIndex && !hasIgnoredIndex && !isConstraintComposite;
                    tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    tableColumn.isPrimary = dbPrimaryKeys.some(dbPrimaryKey => {
                        return this.driver.buildTableName(dbPrimaryKey["TABLE_NAME"], undefined, dbPrimaryKey["TABLE_SCHEMA"]) === tableFullName && dbPrimaryKey["COLUMN_NAME"] === tableColumn.name;
                    });
                    tableColumn.zerofill = dbColumn["COLUMN_TYPE"].indexOf("zerofill") !== -1;
                    tableColumn.unsigned = tableColumn.zerofill ? true : dbColumn["COLUMN_TYPE"].indexOf("unsigned") !== -1;
                    tableColumn.isGenerated = dbColumn["EXTRA"].indexOf("auto_increment") !== -1;
                    if (tableColumn.isGenerated)
                        tableColumn.generationStrategy = "increment";

                    tableColumn.comment = dbColumn["COLUMN_COMMENT"];
                    if (dbColumn["CHARACTER_SET_NAME"])
                        tableColumn.charset = dbColumn["CHARACTER_SET_NAME"] === defaultCharset ? undefined : dbColumn["CHARACTER_SET_NAME"];
                    if (dbColumn["COLLATION_NAME"])
                        tableColumn.collation = dbColumn["COLLATION_NAME"] === defaultCollation ? undefined : dbColumn["COLLATION_NAME"];

                    if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type as ColumnType) !== -1 && dbColumn["CHARACTER_MAXIMUM_LENGTH"]) {
                        const length = dbColumn["CHARACTER_MAXIMUM_LENGTH"].toString();
                        tableColumn.length = !this.isDefaultColumnLength(table, tableColumn, length) ? length : "";
                    }

                    if (tableColumn.type === "decimal" || tableColumn.type === "double" || tableColumn.type === "float") {
                        if (dbColumn["NUMERIC_PRECISION"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["NUMERIC_PRECISION"]))
                            tableColumn.precision = parseInt(dbColumn["NUMERIC_PRECISION"]);
                        if (dbColumn["NUMERIC_SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["NUMERIC_SCALE"]))
                            tableColumn.scale = parseInt(dbColumn["NUMERIC_SCALE"]);
                    }

                    if (tableColumn.type === "enum") {
                        const colType = dbColumn["COLUMN_TYPE"];
                        const items = colType.substring(colType.indexOf("(") + 1, colType.indexOf(")")).split(",");
                        tableColumn.enum = (items as string[]).map(item => {
                            return item.substring(1, item.length - 1);
                        });
                        tableColumn.length = "";
                    }

                    if ((tableColumn.type === "datetime" || tableColumn.type === "time" || tableColumn.type === "timestamp") && dbColumn["DATETIME_PRECISION"]) {
                        tableColumn.precision = parseInt(dbColumn["DATETIME_PRECISION"]);
                    }

                    return tableColumn;
                });

            const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                return this.driver.buildTableName(dbForeignKey["TABLE_NAME"], undefined, dbForeignKey["TABLE_SCHEMA"]) === tableFullName;
            }), dbForeignKey => dbForeignKey["CONSTRAINT_NAME"]);

            table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);

                const database = dbForeignKey["REFERENCED_TABLE_SCHEMA"] === currentDatabase ? undefined : dbForeignKey["REFERENCED_TABLE_SCHEMA"];
                const referencedTableName = this.driver.buildTableName(dbForeignKey["REFERENCED_TABLE_NAME"], undefined, database);

                return new TableForeignKey({
                    name: dbForeignKey["CONSTRAINT_NAME"],
                    columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                    referencedTableName: referencedTableName,
                    referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                    onDelete: dbForeignKey["ON_DELETE"],
                    onUpdate: dbForeignKey["ON_UPDATE"]
                });
            });

            const tableIndexConstraints = OrmUtils.uniq(dbIndices.filter(dbIndex => {
                return this.driver.buildTableName(dbIndex["TABLE_NAME"], undefined, dbIndex["TABLE_SCHEMA"]) === tableFullName;
            }), dbIndex => dbIndex["INDEX_NAME"]);

            table.indices = tableIndexConstraints.map(constraint => {
                const indices = dbIndices.filter(index => index["INDEX_NAME"] === constraint["INDEX_NAME"]);
                return new TableIndex(<TableIndexOptions>{
                    table: table,
                    name: constraint["INDEX_NAME"],
                    columnNames: indices.map(i => i["COLUMN_NAME"]),
                    isUnique: constraint["NON_UNIQUE"] === "0",
                    isSpatial: constraint["INDEX_TYPE"] === "SPATIAL",
                    isFulltext: constraint["INDEX_TYPE"] === "FULLTEXT"
                });
            });

            return table;
        }));
    }

    protected createTableSql(table: Table, createForeignKeys?: boolean): string {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, true)).join(", ");
        let sql = `CREATE TABLE ${this.escapeTableName(table)} (${columnDefinitions}`;

        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
                const isUniqueIndexExist = table.indices.some(index => {
                    return index.columnNames.length === 1 && !!index.isUnique && index.columnNames.indexOf(column.name) !== -1;
                });
                const isUniqueConstraintExist = table.uniques.some(unique => {
                    return unique.columnNames.length === 1 && unique.columnNames.indexOf(column.name) !== -1;
                });
                if (!isUniqueIndexExist && !isUniqueConstraintExist)
                    table.indices.push(new TableIndex({
                        name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                        columnNames: [column.name],
                        isUnique: true
                    }));
            });

        if (table.uniques.length > 0) {
            table.uniques.forEach(unique => {
                const uniqueExist = table.indices.some(index => index.name === unique.name);
                if (!uniqueExist) {
                    table.indices.push(new TableIndex({
                        name: unique.name,
                        columnNames: unique.columnNames,
                        isUnique: true
                    }));
                }
            });
        }

        if (table.indices.length > 0) {
            const indicesSql = table.indices.map(index => {
                const columnNames = index.columnNames.map(columnName => `\`${columnName}\``).join(", ");
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);

                let indexType = "";
                if (index.isUnique)
                    indexType += "UNIQUE ";
                if (index.isSpatial)
                    indexType += "SPATIAL ";
                if (index.isFulltext)
                    indexType += "FULLTEXT ";

                return `${indexType}INDEX \`${index.name}\` (${columnNames})`;
            }).join(", ");

            sql += `, ${indicesSql}`;
        }

        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `\`${columnName}\``).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `\`${columnName}\``).join(", ");

                let constraint = `CONSTRAINT \`${fk.name}\` FOREIGN KEY (${columnNames}) REFERENCES ${this.escapeTableName(fk.referencedTableName)} (${referencedColumnNames})`;
                if (fk.onDelete)
                    constraint += ` ON DELETE ${fk.onDelete}`;
                if (fk.onUpdate)
                    constraint += ` ON UPDATE ${fk.onUpdate}`;

                return constraint;
            }).join(", ");

            sql += `, ${foreignKeysSql}`;
        }

        if (table.primaryColumns.length > 0) {
            const columnNames = table.primaryColumns.map(column => `\`${column.name}\``).join(", ");
            sql += `, PRIMARY KEY (${columnNames})`;
        }

        sql += `) ENGINE=${table.engine || "InnoDB"}`;

        return sql;
    }

    protected dropTableSql(tableOrName: Table|string): string {
        return `DROP TABLE ${this.escapeTableName(tableOrName)}`;
    }

    protected createIndexSql(table: Table, index: TableIndex): string {
        const columns = index.columnNames.map(columnName => `\`${columnName}\``).join(", ");
        let indexType = "";
        if (index.isUnique)
            indexType += "UNIQUE ";
        if (index.isSpatial)
            indexType += "SPATIAL ";
        if (index.isFulltext)
            indexType += "FULLTEXT ";
        return `CREATE ${indexType}INDEX \`${index.name}\` ON ${this.escapeTableName(table)}(${columns})`;
    }

    protected dropIndexSql(table: Table, indexOrName: TableIndex|string): string {
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return `DROP INDEX \`${indexName}\` ON ${this.escapeTableName(table)}`;
    }

    protected createPrimaryKeySql(table: Table, columnNames: string[]): string {
        const columnNamesString = columnNames.map(columnName => `\`${columnName}\``).join(", ");
        return `ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNamesString})`;
    }

    protected dropPrimaryKeySql(table: Table): string {
        return `ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`;
    }

    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): string {
        const columnNames = foreignKey.columnNames.map(column => `\`${column}\``).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `\`${column}\``).join(",");
        let sql = `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT \`${foreignKey.name}\` FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        if (foreignKey.onUpdate)
            sql += ` ON UPDATE ${foreignKey.onUpdate}`;

        return sql;
    }

    protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey|string): string {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return `ALTER TABLE ${this.escapeTableName(table)} DROP FOREIGN KEY \`${foreignKeyName}\``;
    }

    protected parseTableName(target: Table|string) {
        const tableName = target instanceof Table ? target.name : target;
        return {
            database: tableName.indexOf(".") !== -1 ? tableName.split(".")[0] : this.driver.database,
            tableName: tableName.indexOf(".") !== -1 ? tableName.split(".")[1] : tableName
        };
    }

    protected escapeTableName(target: Table|string, disableEscape?: boolean): string {
        const tableName = target instanceof Table ? target.name : target;
        return tableName.split(".").map(i => disableEscape ? i : `\`${i}\``).join(".");
    }

    protected buildCreateColumnSql(column: TableColumn, skipPrimary: boolean, skipName: boolean = false) {
        let c = "";
        if (skipName) {
            c = this.connection.driver.createFullType(column);
        } else {
            c = `\`${column.name}\` ${this.connection.driver.createFullType(column)}`;
        }
        if (column.asExpression)
            c += ` AS (${column.asExpression}) ${column.generatedType ? column.generatedType : "VIRTUAL"}`;

        if (column.zerofill) {
            c += " ZEROFILL";
        } else if (column.unsigned) {
            c += " UNSIGNED";
        }
        if (column.enum)
            c += ` (${column.enum.map(value => "'" + value + "'").join(", ")})`;
        if (column.charset)
            c += ` CHARACTER SET "${column.charset}"`;
        if (column.collation)
            c += ` COLLATE "${column.collation}"`;
        if (!column.isNullable)
            c += " NOT NULL";
        if (column.isNullable)
            c += " NULL";
        if (column.isPrimary && !skipPrimary)
            c += " PRIMARY KEY";
        if (column.isGenerated && column.generationStrategy === "increment") // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTO_INCREMENT";
        if (column.comment)
            c += ` COMMENT '${column.comment}'`;
        if (column.default !== undefined && column.default !== null)
            c += ` DEFAULT ${column.default}`;
        if (column.onUpdate)
            c += ` ON UPDATE ${column.onUpdate}`;

        return c;
    }
}