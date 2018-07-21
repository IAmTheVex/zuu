import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {QueryFailedError} from "../../error/QueryFailedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {SqliteDriver} from "./SqliteDriver";
import {Broadcaster} from "../../subscriber/Broadcaster";

export class SqliteQueryRunner extends AbstractSqliteQueryRunner {

    driver: SqliteDriver;

    constructor(driver: SqliteDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const connection = this.driver.connection;

        return new Promise<any[]>(async (ok, fail) => {

            const handler = function (err: any, result: any) {
                const maxQueryExecutionTime = connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                if (err) {
                    connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
                } else {
                    ok(isInsertQuery ? this["lastID"] : result);
                }
            };

            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            const isInsertQuery = query.substr(0, 11) === "INSERT INTO";
            if (isInsertQuery) {
                databaseConnection.run(query, parameters, handler);
            } else {
                databaseConnection.all(query, parameters, handler);
            }
        });
    }
}