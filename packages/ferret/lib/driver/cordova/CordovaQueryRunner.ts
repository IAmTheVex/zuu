import {ObjectLiteral} from "../../common/ObjectLiteral";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {QueryFailedError} from "../../error/QueryFailedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {CordovaDriver} from "./CordovaDriver";
import {Broadcaster} from "../../subscriber/Broadcaster";

export class CordovaQueryRunner extends AbstractSqliteQueryRunner {
    
    driver: CordovaDriver;

    constructor(driver: CordovaDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise<any[]>(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            databaseConnection.executeSql(query, parameters, (result: any) => {

                const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                if (query.substr(0, 11) === "INSERT INTO") {
                    ok(result.insertId);
                }
                else {
                    let resultSet = [];
                    for (let i = 0; i < result.rows.length; i++) {
                        resultSet.push(result.rows.item(i));
                    }
                    
                    ok(resultSet);
                }
            }, (err: any) => {
                this.driver.connection.logger.logQueryError(err, query, parameters, this);
                fail(new QueryFailedError(query, parameters, err));
            });
        });
    }

    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => `"${key}"` + "=?");
    }
}