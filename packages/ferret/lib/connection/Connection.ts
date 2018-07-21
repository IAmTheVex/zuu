import {Driver} from "../driver/Driver";
import {Repository} from "../repository/Repository";
import {EntitySubscriberInterface} from "../subscriber/EntitySubscriberInterface";
import {ObjectType} from "../common/ObjectType";
import {EntityManager} from "../entity-manager/EntityManager";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {CannotExecuteNotConnectedError} from "../error/CannotExecuteNotConnectedError";
import {CannotConnectAlreadyConnectedError} from "../error/CannotConnectAlreadyConnectedError";
import {TreeRepository} from "../repository/TreeRepository";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Logger} from "../logger/Logger";
import {EntityMetadataNotFoundError} from "../error/EntityMetadataNotFoundError";
import {MigrationInterface} from "../migration/MigrationInterface";
import {MigrationExecutor} from "../migration/MigrationExecutor";
import {MongoRepository} from "../repository/MongoRepository";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {MongoEntityManager} from "../entity-manager/MongoEntityManager";
import {EntityMetadataValidator} from "../metadata-builder/EntityMetadataValidator";
import {ConnectionOptions} from "./ConnectionOptions";
import {QueryRunnerProviderAlreadyReleasedError} from "../error/QueryRunnerProviderAlreadyReleasedError";
import {EntityManagerFactory} from "../entity-manager/EntityManagerFactory";
import {DriverFactory} from "../driver/DriverFactory";
import {ConnectionMetadataBuilder} from "./ConnectionMetadataBuilder";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";
import {LoggerFactory} from "../logger/LoggerFactory";
import {QueryResultCacheFactory} from "../cache/QueryResultCacheFactory";
import {QueryResultCache} from "../cache/QueryResultCache";
import {SqljsEntityManager} from "../entity-manager/SqljsEntityManager";
import {RelationLoader} from "../query-builder/RelationLoader";
import {RelationIdLoader} from "../query-builder/RelationIdLoader";
import {EntitySchema} from "../";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {MysqlDriver} from "../driver/mysql/MysqlDriver";
import {PromiseUtils} from "../";

export class Connection {

    readonly name: string;

    readonly options: ConnectionOptions;

    readonly isConnected = false;

    readonly driver: Driver;

    readonly manager: EntityManager;

    readonly namingStrategy: NamingStrategyInterface;

    readonly logger: Logger;

    readonly migrations: MigrationInterface[] = [];

    readonly subscribers: EntitySubscriberInterface<any>[] = [];

    readonly entityMetadatas: EntityMetadata[] = [];

    readonly queryResultCache?: QueryResultCache;

    readonly relationLoader: RelationLoader;

    readonly relationIdLoader: RelationIdLoader;

    constructor(options: ConnectionOptions) {
        this.name = options.name || "default";
        this.options = options;
        this.logger = new LoggerFactory().create(this.options.logger, this.options.logging);
        this.driver = new DriverFactory().create(this);
        this.manager = this.createEntityManager();
        this.namingStrategy = options.namingStrategy || new DefaultNamingStrategy();
        this.queryResultCache = options.cache ? new QueryResultCacheFactory(this).create() : undefined;
        this.relationLoader = new RelationLoader(this);
        this.relationIdLoader = new RelationIdLoader(this);
    }

    get mongoManager(): MongoEntityManager {
        if (!(this.manager instanceof MongoEntityManager))
            throw new Error(`MongoEntityManager is only available for MongoDB databases.`);

        return this.manager as MongoEntityManager;
    }

    get sqljsManager(): SqljsEntityManager {
        if (!(this.manager instanceof SqljsEntityManager))
            throw new Error(`SqljsEntityManager is only available for Sqljs databases.`);

        return this.manager as SqljsEntityManager;
    }

    async connect(): Promise<this> {
        if (this.isConnected)
            throw new CannotConnectAlreadyConnectedError(this.name);

        // connect to the database via its driver
        await this.driver.connect();

        // connect to the cache-specific database if cache is enabled
        if (this.queryResultCache)
            await this.queryResultCache.connect();

        // set connected status for the current connection
        Object.assign(this, { isConnected: true });

        try {

            // build all metadatas registered in the current connection
            this.buildMetadatas();

            await this.driver.afterConnect();

            // if option is set - drop schema once connection is done
            if (this.options.dropSchema)
                await this.dropDatabase();

            // if option is set - automatically synchronize a schema
            if (this.options.synchronize)
                await this.synchronize();

            // if option is set - automatically synchronize a schema
            if (this.options.migrationsRun)
                await this.runMigrations();

        } catch (error) {

            // if for some reason build metadata fail (for example validation error during entity metadata check)
            // connection needs to be closed
            await this.close();
            throw error;
        }

        return this;
    }

    async close(): Promise<void> {
        if (!this.isConnected)
            throw new CannotExecuteNotConnectedError(this.name);

        await this.driver.disconnect();

        // disconnect from the cache-specific database if cache was enabled
        if (this.queryResultCache)
            await this.queryResultCache.disconnect();

        Object.assign(this, { isConnected: false });
    }

    async synchronize(dropBeforeSync: boolean = false): Promise<void> {

        if (!this.isConnected)
            throw new CannotExecuteNotConnectedError(this.name);

        if (dropBeforeSync)
            await this.dropDatabase();

        const schemaBuilder = this.driver.createSchemaBuilder();
        await schemaBuilder.build();
    }

    async dropDatabase(): Promise<void> {
        const queryRunner = await this.createQueryRunner("master");
        if (this.driver instanceof SqlServerDriver || this.driver instanceof MysqlDriver) {
            const databases: string[] = this.driver.database ? [this.driver.database] : [];
            this.entityMetadatas.forEach(metadata => {
                if (metadata.database && databases.indexOf(metadata.database) === -1)
                    databases.push(metadata.database);
            });
            await PromiseUtils.runInSequence(databases, database => queryRunner.clearDatabase(database));
        } else {
            await queryRunner.clearDatabase();
        }
        await queryRunner.release();
    }

    async runMigrations(options?: { transaction?: boolean }): Promise<void> {
        if (!this.isConnected)
            throw new CannotExecuteNotConnectedError(this.name);

        const migrationExecutor = new MigrationExecutor(this);
        if (options && options.transaction === false) {
            migrationExecutor.transaction = false;
        }
        await migrationExecutor.executePendingMigrations();
    }

    async undoLastMigration(options?: { transaction?: boolean }): Promise<void> {

        if (!this.isConnected)
            throw new CannotExecuteNotConnectedError(this.name);

        const migrationExecutor = new MigrationExecutor(this);
        if (options && options.transaction === false) {
            migrationExecutor.transaction = false;
        }
        await migrationExecutor.undoLastMigration();
    }

    hasMetadata(target: Function|EntitySchema<any>|string): boolean {
        return !!this.findMetadata(target);
    }

    getMetadata(target: Function|EntitySchema<any>|string): EntityMetadata {
        const metadata = this.findMetadata(target);
        if (!metadata)
            throw new EntityMetadataNotFoundError(target);

        return metadata;
    }

    getRepository<Entity>(target: ObjectType<Entity>|EntitySchema<Entity>|string): Repository<Entity> {
        return this.manager.getRepository(target);
    }

    getTreeRepository<Entity>(target: ObjectType<Entity>|EntitySchema<Entity>|string): TreeRepository<Entity> {
        return this.manager.getTreeRepository(target);
    }

    getMongoRepository<Entity>(target: ObjectType<Entity>|EntitySchema<Entity>|string): MongoRepository<Entity> {
        if (!(this.driver instanceof MongoDriver))
            throw new Error(`You can use getMongoRepository only for MongoDB connections.`);

        return this.manager.getRepository(target) as any;
    }

    getCustomRepository<T>(customRepository: ObjectType<T>): T {
        return this.manager.getCustomRepository(customRepository);
    }

    async transaction(runInTransaction: (entityManager: EntityManager) => Promise<any>): Promise<any> {
        return this.manager.transaction(runInTransaction);
    }

    async query(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<any> {
        if (this instanceof MongoEntityManager)
            throw new Error(`Queries aren't supported by MongoDB.`);

        if (queryRunner && queryRunner.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        const usedQueryRunner = queryRunner || this.createQueryRunner("master");

        try {
            return await usedQueryRunner.query(query, parameters);  // await is needed here because we are using finally

        } finally {
            if (!queryRunner)
                await usedQueryRunner.release();
        }
    }

    createQueryBuilder<Entity>(entityClass: ObjectType<Entity>|EntitySchema<Entity>|Function|string, alias: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity>;

    createQueryBuilder(queryRunner?: QueryRunner): SelectQueryBuilder<any>;

    createQueryBuilder<Entity>(entityOrRunner?: ObjectType<Entity>|EntitySchema<Entity>|Function|string|QueryRunner, alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
        if (this instanceof MongoEntityManager)
            throw new Error(`Query Builder is not supported by MongoDB.`);

        if (alias) {
            const metadata = this.getMetadata(entityOrRunner as Function|EntitySchema<Entity>|string);
            return new SelectQueryBuilder(this, queryRunner)
                .select(alias)
                .from(metadata.target, alias);

        } else {
            return new SelectQueryBuilder(this, entityOrRunner as QueryRunner|undefined);
        }
    }

    createQueryRunner(mode: "master"|"slave" = "master"): QueryRunner {
        const queryRunner = this.driver.createQueryRunner(mode);
        const manager = this.createEntityManager(queryRunner);
        Object.assign(queryRunner, { manager: manager });
        return queryRunner;
    }

    getManyToManyMetadata(entityTarget: Function|string, relationPropertyPath: string) {
        const relationMetadata = this.getMetadata(entityTarget).findRelationWithPropertyPath(relationPropertyPath);
        if (!relationMetadata)
            throw new Error(`Relation "${relationPropertyPath}" was not found in ${entityTarget} entity.`);
        if (!relationMetadata.isManyToMany)
            throw new Error(`Relation "${entityTarget}#${relationPropertyPath}" does not have a many-to-many relationship.` +
                `You can use this method only on many-to-many relations.`);

        return relationMetadata.junctionEntityMetadata;
    }

    createEntityManager(queryRunner?: QueryRunner): EntityManager {
        return new EntityManagerFactory().create(this, queryRunner);
    }

    protected findMetadata(target: Function|EntitySchema<any>|string): EntityMetadata|undefined {
        return this.entityMetadatas.find(metadata => {
            if (metadata.target === target)
                return true;
            if (target instanceof EntitySchema) {
                return metadata.name === target.options.name;
            }
            if (typeof target === "string") {
                if (target.indexOf(".") !== -1) {
                    return metadata.tablePath === target;
                } else {
                    return metadata.name === target || metadata.tableName === target;
                }
            }

            return false;
        });
    }

    protected buildMetadatas(): void {

        const connectionMetadataBuilder = new ConnectionMetadataBuilder(this);
        const entityMetadataValidator = new EntityMetadataValidator();

        // create subscribers instances if they are not disallowed from high-level (for example they can disallowed from migrations run process)
        const subscribers = connectionMetadataBuilder.buildSubscribers(this.options.subscribers || []);
        Object.assign(this, { subscribers: subscribers });

        // build entity metadatas
        const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas(this.options.entities || []);
        Object.assign(this, { entityMetadatas: entityMetadatas });

        // create migration instances
        const migrations = connectionMetadataBuilder.buildMigrations(this.options.migrations || []);
        Object.assign(this, { migrations: migrations });

        // validate all created entity metadatas to make sure user created entities are valid and correct
        entityMetadataValidator.validateMany(this.entityMetadatas, this.driver);
    }

}
