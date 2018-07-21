import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {SqljsDriver} from "./SqljsDriver";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {QueryFailedError} from "../../error/QueryFailedError";

export class SqljsQueryRunner extends AbstractSqliteQueryRunner {
    
    driver: SqljsDriver;

    constructor(driver: SqljsDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    async commitTransaction(): Promise<void> {
        await super.commitTransaction();
        await this.driver.autoSave();
    }

    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise<any[]>(async (ok, fail) => {
            const databaseConnection = this.driver.databaseConnection;
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            try {
                const statement = databaseConnection.prepare(query);
                statement.bind(parameters);
                
                const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                const result: any[] = [];

                while (statement.step()) {
                    result.push(statement.getAsObject());
                }
                
                statement.free();
                ok(result);
            }
            catch (e) {
                this.driver.connection.logger.logQueryError(e, query, parameters, this);
                fail(new QueryFailedError(query, parameters, e));
            }
        });
    }
}