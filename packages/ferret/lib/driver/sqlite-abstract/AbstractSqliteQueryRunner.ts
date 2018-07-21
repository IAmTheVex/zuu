import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Table} from "../../schema-builder/table/Table";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {AbstractSqliteDriver} from "./AbstractSqliteDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {TableIndexOptions} from "../../schema-builder/options/TableIndexOptions";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";
import {OrmUtils} from "../../util/OrmUtils";
import {TableCheck} from "../../schema-builder/table/TableCheck";

export abstract class AbstractSqliteQueryRunner extends BaseQueryRunner implements QueryRunner {

    driver: AbstractSqliteDriver;

    constructor() {
        super();
    }

    connect(): Promise<any> {
        return Promise.resolve(this.driver.databaseConnection);
    }

    release(): Promise<void> {
        this.loadedTables = [];
        this.clearSqlMemory();
        return Promise.resolve();
    }

    async startTransaction(): Promise<void> {
        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        this.isTransactionActive = true;
        await this.query("BEGIN TRANSACTION");
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

    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        throw new Error(`Stream is not supported by sqlite driver.`);
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
        throw new Error(`This driver does not support table schemas`);
    }

    async hasTable(tableOrName: Table|string): Promise<boolean> {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const sql = `SELECT * FROM "sqlite_master" WHERE "type" = 'table' AND "name" = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    async hasColumn(tableOrName: Table|string, columnName: string): Promise<boolean> {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const sql = `PRAGMA table_info("${tableName}")`;
        const columns: ObjectLiteral[] = await this.query(sql);
        return !!columns.find(column => column["name"] === columnName);
    }

    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        return Promise.resolve();
    }

    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        return Promise.resolve();
    }

    async createSchema(schema: string, ifNotExist?: boolean): Promise<void> {
        return Promise.resolve();
    }

    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        return Promise.resolve();
    }

    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true, createIndices: boolean = true): Promise<void> {
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }

        upQueries.push(this.createTableSql(table, createForeignKeys));
        downQueries.push(this.dropTableSql(table));

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

    async dropTable(tableOrName: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {
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

        upQueries.push(this.dropTableSql(table, ifExist));
        downQueries.push(this.createTableSql(table, createForeignKeys));

        await this.executeQueries(upQueries, downQueries);
    }

    async renameTable(oldTableOrName: Table|string, newTableName: string): Promise<void> {
        const oldTable = oldTableOrName instanceof Table ? oldTableOrName : await this.getCachedTable(oldTableOrName);
        const newTable = oldTable.clone();
        newTable.name = newTableName;

        const up = `ALTER TABLE "${oldTable.name}" RENAME TO "${newTableName}"`;
        const down = `ALTER TABLE "${newTableName}" RENAME TO "${oldTable.name}"`;
        await this.executeQueries(up, down);

        oldTable.name = newTable.name;

        newTable.uniques.forEach(unique => {
            unique.name = this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);
        });

        newTable.foreignKeys.forEach(foreignKey => {
            foreignKey.name = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames);
        });

        newTable.indices.forEach(index => {
            index.name = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
        });

        await this.recreateTable(newTable, oldTable);
    }

    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        return this.addColumns(table!, [column]);
    }

    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const changedTable = table.clone();
        columns.forEach(column => changedTable.addColumn(column));
        await this.recreateTable(changedTable, table);
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

        return this.changeColumn(table, oldColumn, newColumn);
    }

    async changeColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        await this.changeColumns(table, [{oldColumn, newColumn}]);
    }

    async changeColumns(tableOrName: Table|string, changedColumns: { oldColumn: TableColumn, newColumn: TableColumn }[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const changedTable = table.clone();
        changedColumns.forEach(changedColumnSet => {
            if (changedColumnSet.newColumn.name !== changedColumnSet.oldColumn.name) {
                changedTable.findColumnUniques(changedColumnSet.oldColumn).forEach(unique => {
                    unique.columnNames.splice(unique.columnNames.indexOf(changedColumnSet.oldColumn.name), 1);
                    unique.columnNames.push(changedColumnSet.newColumn.name);
                    unique.name = this.connection.namingStrategy.uniqueConstraintName(changedTable, unique.columnNames);
                });

                changedTable.findColumnForeignKeys(changedColumnSet.oldColumn).forEach(fk => {
                    fk.columnNames.splice(fk.columnNames.indexOf(changedColumnSet.oldColumn.name), 1);
                    fk.columnNames.push(changedColumnSet.newColumn.name);
                    fk.name = this.connection.namingStrategy.foreignKeyName(changedTable, fk.columnNames);
                });

                changedTable.findColumnIndices(changedColumnSet.oldColumn).forEach(index => {
                    index.columnNames.splice(index.columnNames.indexOf(changedColumnSet.oldColumn.name), 1);
                    index.columnNames.push(changedColumnSet.newColumn.name);
                    index.name = this.connection.namingStrategy.indexName(changedTable, index.columnNames, index.where);
                });
            }
            const originalColumn = changedTable.columns.find(column => column.name === changedColumnSet.oldColumn.name);
            if (originalColumn)
                changedTable.columns[changedTable.columns.indexOf(originalColumn)] = changedColumnSet.newColumn;
        });

        await this.recreateTable(changedTable, table);
    }

    async dropColumn(tableOrName: Table|string, columnOrName: TableColumn|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
        if (!column)
            throw new Error(`Column "${columnOrName}" was not found in table "${table.name}"`);

        await this.dropColumns(table, [column]);
    }

    async dropColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        const changedTable = table.clone();
        columns.forEach(column => {
            changedTable.removeColumn(column);
            changedTable.findColumnUniques(column).forEach(unique => changedTable.removeUniqueConstraint(unique));
            changedTable.findColumnIndices(column).forEach(index => changedTable.removeIndex(index));
            changedTable.findColumnForeignKeys(column).forEach(fk => changedTable.removeForeignKey(fk));
        });

        await this.recreateTable(changedTable, table);

        columns.forEach(column => {
            table.removeColumn(column);
            table.findColumnUniques(column).forEach(unique => table.removeUniqueConstraint(unique));
            table.findColumnIndices(column).forEach(index => table.removeIndex(index));
            table.findColumnForeignKeys(column).forEach(fk => table.removeForeignKey(fk));
        });
    }

    async createPrimaryKey(tableOrName: Table|string, columnNames: string[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const changedTable = table.clone();
        changedTable.columns.forEach(column => {
            if (columnNames.find(columnName => columnName === column.name))
                column.isPrimary = true;
        });

        await this.recreateTable(changedTable, table);
        table.columns.forEach(column => {
            if (columnNames.find(columnName => columnName === column.name))
                column.isPrimary = true;
        });
    }

    async updatePrimaryKeys(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        await Promise.resolve();
    }

    async dropPrimaryKey(tableOrName: Table|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const changedTable = table.clone();
        changedTable.primaryColumns.forEach(column => {
            column.isPrimary = false;
        });

        await this.recreateTable(changedTable, table);
        table.primaryColumns.forEach(column => {
            column.isPrimary = false;
        });
    }

    async createUniqueConstraint(tableOrName: Table|string, uniqueConstraint: TableUnique): Promise<void> {
        await this.createUniqueConstraints(tableOrName, [uniqueConstraint]);
    }

    async createUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        const changedTable = table.clone();
        uniqueConstraints.forEach(uniqueConstraint => changedTable.addUniqueConstraint(uniqueConstraint));
        await this.recreateTable(changedTable, table);
    }

    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
        if (!uniqueConstraint)
            throw new Error(`Supplied unique constraint was not found in table ${table.name}`);

        await this.dropUniqueConstraints(table, [uniqueConstraint]);
    }

    async dropUniqueConstraints(tableOrName: Table|string, uniqueConstraints: TableUnique[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        const changedTable = table.clone();
        uniqueConstraints.forEach(uniqueConstraint => changedTable.removeUniqueConstraint(uniqueConstraint));

        await this.recreateTable(changedTable, table);
    }

    async createCheckConstraint(tableOrName: Table|string, checkConstraint: TableCheck): Promise<void> {
        await this.createCheckConstraints(tableOrName, [checkConstraint]);
    }

    async createCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        const changedTable = table.clone();
        checkConstraints.forEach(checkConstraint => changedTable.addCheckConstraint(checkConstraint));
        await this.recreateTable(changedTable, table);
    }

    async dropCheckConstraint(tableOrName: Table|string, checkOrName: TableCheck|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(c => c.name === checkOrName);
        if (!checkConstraint)
            throw new Error(`Supplied check constraint was not found in table ${table.name}`);

        await this.dropCheckConstraints(table, [checkConstraint]);
    }

    async dropCheckConstraints(tableOrName: Table|string, checkConstraints: TableCheck[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        const changedTable = table.clone();
        checkConstraints.forEach(checkConstraint => changedTable.removeCheckConstraint(checkConstraint));

        await this.recreateTable(changedTable, table);
    }

    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        await this.createForeignKeys(tableOrName, [foreignKey]);
    }

    async createForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const changedTable = table.clone();
        foreignKeys.forEach(foreignKey => changedTable.addForeignKey(foreignKey));

        await this.recreateTable(changedTable, table);
    }

    async dropForeignKey(tableOrName: Table|string, foreignKeyOrName: TableForeignKey|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
        if (!foreignKey)
            throw new Error(`Supplied foreign key was not found in table ${table.name}`);

        await this.dropForeignKeys(tableOrName, [foreignKey]);
    }

    async dropForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        const changedTable = table.clone();
        foreignKeys.forEach(foreignKey => changedTable.removeForeignKey(foreignKey));

        await this.recreateTable(changedTable, table);
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
        await this.query(`DELETE FROM "${tableName}"`);
    }

    async clearDatabase(): Promise<void> {
        await this.query(`PRAGMA foreign_keys = OFF;`);
        await this.startTransaction();
        try {
            const selectDropsQuery = `SELECT 'DROP TABLE "' || name || '";' as query FROM "sqlite_master" WHERE "type" = 'table' AND "name" != 'sqlite_sequence'`;
            const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
            await Promise.all(dropQueries.map(q => this.query(q["query"])));
            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;

        } finally {
            await this.query(`PRAGMA foreign_keys = ON;`);
        }
    }

    protected async loadTables(tableNames: string[]): Promise<Table[]> {
        if (!tableNames || !tableNames.length)
            return [];

        const tableNamesString = tableNames.map(tableName => `'${tableName}'`).join(", ");

        const dbTables: ObjectLiteral[] = await this.query(`SELECT * FROM "sqlite_master" WHERE "type" = 'table' AND "name" IN (${tableNamesString})`);

        const dbIndicesDef: ObjectLiteral[] = await this.query(`SELECT * FROM "sqlite_master" WHERE "type" = 'index' AND "tbl_name" IN (${tableNamesString})`);

        if (!dbTables || !dbTables.length)
            return [];

        return Promise.all(dbTables.map(async dbTable => {
            const table = new Table({name: dbTable["name"]});
            const sql = dbTable["sql"];

            const [dbColumns, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
                this.query(`PRAGMA table_info("${dbTable["name"]}")`),
                this.query(`PRAGMA index_list("${dbTable["name"]}")`),
                this.query(`PRAGMA foreign_key_list("${dbTable["name"]}")`),
            ]);

            let autoIncrementColumnName: string|undefined = undefined;
            const tableSql: string = dbTable["sql"];
            if (tableSql.indexOf("AUTOINCREMENT") !== -1) {
                autoIncrementColumnName = tableSql.substr(0, tableSql.indexOf("AUTOINCREMENT"));
                const comma = autoIncrementColumnName.lastIndexOf(",");
                const bracket = autoIncrementColumnName.lastIndexOf("(");
                if (comma !== -1) {
                    autoIncrementColumnName = autoIncrementColumnName.substr(comma);
                    autoIncrementColumnName = autoIncrementColumnName.substr(0, autoIncrementColumnName.lastIndexOf("\""));
                    autoIncrementColumnName = autoIncrementColumnName.substr(autoIncrementColumnName.indexOf("\"") + 1);

                } else if (bracket !== -1) {
                    autoIncrementColumnName = autoIncrementColumnName.substr(bracket);
                    autoIncrementColumnName = autoIncrementColumnName.substr(0, autoIncrementColumnName.lastIndexOf("\""));
                    autoIncrementColumnName = autoIncrementColumnName.substr(autoIncrementColumnName.indexOf("\"") + 1);
                }
            }

            table.columns = dbColumns.map(dbColumn => {
                const tableColumn = new TableColumn();
                tableColumn.name = dbColumn["name"];
                tableColumn.type = dbColumn["type"].toLowerCase();
                tableColumn.default = dbColumn["dflt_value"] !== null && dbColumn["dflt_value"] !== undefined ? dbColumn["dflt_value"] : undefined;
                tableColumn.isNullable = dbColumn["notnull"] === 0;

                tableColumn.isPrimary = dbColumn["pk"] > 0;
                tableColumn.comment = ""; // SQLite does not support column comments
                tableColumn.isGenerated = autoIncrementColumnName === dbColumn["name"];
                if (tableColumn.isGenerated) {
                    tableColumn.generationStrategy = "increment";
                }

                let pos = tableColumn.type.indexOf("(");
                if (pos !== -1) {
                    let dataType = tableColumn.type.substr(0, pos);
                    if (!!this.driver.withLengthColumnTypes.find(col => col === dataType)) {
                        let len = parseInt(tableColumn.type.substring(pos + 1, tableColumn.type.length - 1));
                        if (len) {
                            tableColumn.length = len.toString();
                            tableColumn.type = dataType; // remove the length part from the datatype
                        }
                    }
                }

                return tableColumn;
            });

            const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys, dbForeignKey => dbForeignKey["id"]);
            table.foreignKeys = tableForeignKeyConstraints.map(foreignKey => {
                const ownForeignKeys = dbForeignKeys.filter(dbForeignKey => dbForeignKey["id"] === foreignKey["id"] && dbForeignKey["table"] === foreignKey["table"]);
                const columnNames = ownForeignKeys.map(dbForeignKey => dbForeignKey["from"]);
                const referencedColumnNames = ownForeignKeys.map(dbForeignKey => dbForeignKey["to"]);

                const fkName = this.connection.namingStrategy.foreignKeyName(table, columnNames);

                return new TableForeignKey({
                    name: fkName,
                    columnNames: columnNames,
                    referencedTableName: foreignKey["table"],
                    referencedColumnNames: referencedColumnNames,
                    onDelete: foreignKey["on_delete"],
                    onUpdate: foreignKey["on_update"]
                });
            });

            const tableUniquePromises = dbIndices
                .filter(dbIndex => dbIndex["origin"] === "u")
                .map(dbIndex => dbIndex["name"])
                .filter((value, index, self) => self.indexOf(value) === index)
                .map(async dbIndexName => {
                    const dbIndex = dbIndices.find(dbIndex => dbIndex["name"] === dbIndexName);
                    const indexInfos: ObjectLiteral[] = await this.query(`PRAGMA index_info("${dbIndex!["name"]}")`);
                    const indexColumns = indexInfos
                        .sort((indexInfo1, indexInfo2) => parseInt(indexInfo1["seqno"]) - parseInt(indexInfo2["seqno"]))
                        .map(indexInfo => indexInfo["name"]);

                    if (indexColumns.length === 1) {
                        const column = table.columns.find(column => {
                            return !!indexColumns.find(indexColumn => indexColumn === column.name);
                        });
                        if (column)
                            column.isUnique = true;
                    }

                    return new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table, indexColumns),
                        columnNames: indexColumns
                    });
                });
            table.uniques = (await Promise.all(tableUniquePromises)) as TableUnique[];

            let result;
            const regexp = /CONSTRAINT "([^"]*)" CHECK (\(.*?\))([,]|[)]$)/g;
            while (((result = regexp.exec(sql)) !== null)) {
                table.checks.push(new TableCheck({ name: result[1], expression: result[2] }));
            }

            const indicesPromises = dbIndices
                .filter(dbIndex => dbIndex["origin"] === "c")
                .map(dbIndex => dbIndex["name"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(async dbIndexName => {

                    const indexDef = dbIndicesDef.find(dbIndexDef => dbIndexDef["name"] === dbIndexName);
                    const condition = /WHERE (.*)/.exec(indexDef!["sql"]);
                    const dbIndex = dbIndices.find(dbIndex => dbIndex["name"] === dbIndexName);
                    const indexInfos: ObjectLiteral[] = await this.query(`PRAGMA index_info("${dbIndex!["name"]}")`);
                    const indexColumns = indexInfos
                        .sort((indexInfo1, indexInfo2) => parseInt(indexInfo1["seqno"]) - parseInt(indexInfo2["seqno"]))
                        .map(indexInfo => indexInfo["name"]);

                    const isUnique = dbIndex!["unique"] === "1" || dbIndex!["unique"] === 1;
                    return new TableIndex(<TableIndexOptions>{
                        table: table,
                        name: dbIndex!["name"],
                        columnNames: indexColumns,
                        isUnique: isUnique,
                        where: condition ? condition[1] : undefined
                    });
                });
            const indices = await Promise.all(indicesPromises);
            table.indices = indices.filter(index => !!index) as TableIndex[];

            return table;
        }));
    }

    protected createTableSql(table: Table, createForeignKeys?: boolean): string {

        const primaryColumns = table.columns.filter(column => column.isPrimary);
        const hasAutoIncrement = primaryColumns.find(column => column.isGenerated && column.generationStrategy === "increment");
        const skipPrimary = primaryColumns.length > 1;
        if (skipPrimary && hasAutoIncrement)
            throw new Error(`Sqlite does not support AUTOINCREMENT on composite primary key`);

        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, skipPrimary)).join(", ");
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
                if (fk.onUpdate)
                    constraint += ` ON UPDATE ${fk.onUpdate}`;

                return constraint;
            }).join(", ");

            sql += `, ${foreignKeysSql}`;
        }

        if (primaryColumns.length > 1) {
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            sql += `, PRIMARY KEY (${columnNames})`;
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
        return `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${table.name}" (${columns}) ${index.where ? "WHERE " + index.where : ""}`;
    }

    protected dropIndexSql(indexOrName: TableIndex|string): string {
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return `DROP INDEX "${indexName}"`;
    }

    protected buildCreateColumnSql(column: TableColumn, skipPrimary?: boolean): string {
        let c = "\"" + column.name + "\"";
        if (column instanceof ColumnMetadata) {
            c += " " + this.driver.normalizeType(column);
        } else {
            c += " " + this.connection.driver.createFullType(column);
        }

        if (column.isPrimary && !skipPrimary)
            c += " PRIMARY KEY";
        if (column.isGenerated === true && column.generationStrategy === "increment") // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTOINCREMENT";
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.default !== undefined && column.default !== null)
            c += " DEFAULT (" + column.default + ")";

        return c;
    }

    protected async recreateTable(newTable: Table, oldTable: Table, migrateData = true): Promise<void> {
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        oldTable.indices.forEach(index => {
            upQueries.push(this.dropIndexSql(index));
            downQueries.push(this.createIndexSql(oldTable, index));
        });

        newTable.name = "temporary_" + newTable.name;

        upQueries.push(this.createTableSql(newTable, true));
        downQueries.push(this.dropTableSql(newTable));

        if (migrateData) {
            let newColumnNames = newTable.columns.map(column => `"${column.name}"`).join(", ");
            let oldColumnNames = oldTable.columns.map(column => `"${column.name}"`).join(", ");
            if (oldTable.columns.length < newTable.columns.length) {
                newColumnNames = newTable.columns.filter(column => {
                    return oldTable.columns.find(c => c.name === column.name);
                }).map(column => `"${column.name}"`).join(", ");

            } else if (oldTable.columns.length > newTable.columns.length) {
                oldColumnNames = oldTable.columns.filter(column => {
                    return newTable.columns.find(c => c.name === column.name);
                }).map(column => `"${column.name}"`).join(", ");
            }

            upQueries.push(`INSERT INTO "${newTable.name}"(${newColumnNames}) SELECT ${oldColumnNames} FROM "${oldTable.name}"`);
            downQueries.push(`INSERT INTO "${oldTable.name}"(${oldColumnNames}) SELECT ${newColumnNames} FROM "${newTable.name}"`);
        }

        upQueries.push(this.dropTableSql(oldTable));
        downQueries.push(this.createTableSql(oldTable, true));

        upQueries.push(`ALTER TABLE "${newTable.name}" RENAME TO "${oldTable.name}"`);
        downQueries.push(`ALTER TABLE "${oldTable.name}" RENAME TO "${newTable.name}"`);
        newTable.name = oldTable.name;

        newTable.indices.forEach(index => {
            if (!index.name)
                index.name = this.connection.namingStrategy.indexName(newTable.name, index.columnNames, index.where);
            upQueries.push(this.createIndexSql(newTable, index));
            downQueries.push(this.dropIndexSql(index));
        });

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(oldTable, newTable);
    }
}
