import {MysqlConnectionOptions} from "../driver/mysql/MysqlConnectionOptions";
import {PostgresConnectionOptions} from "../driver/postgres/PostgresConnectionOptions";
import {SqliteConnectionOptions} from "../driver/sqlite/SqliteConnectionOptions";
import {SqlServerConnectionOptions} from "../driver/sqlserver/SqlServerConnectionOptions";
import {OracleConnectionOptions} from "../driver/oracle/OracleConnectionOptions";
import {MongoConnectionOptions} from "../driver/mongodb/MongoConnectionOptions";
import {CordovaConnectionOptions} from "../driver/cordova/CordovaConnectionOptions";
import {SqljsConnectionOptions} from "../driver/sqljs/SqljsConnectionOptions";
import {ReactNativeConnectionOptions} from "../driver/react-native/ReactNativeConnectionOptions";

export type ConnectionOptions =
    MysqlConnectionOptions|
    PostgresConnectionOptions|
    SqliteConnectionOptions|
    SqlServerConnectionOptions|
    OracleConnectionOptions|
    CordovaConnectionOptions|
    ReactNativeConnectionOptions|
    SqljsConnectionOptions|
    MongoConnectionOptions;