import {Connection} from "./Connection";
import {ConnectionNotFoundError} from "../error/ConnectionNotFoundError";
import {ConnectionOptions} from "./ConnectionOptions";
import {AlreadyHasActiveConnectionError} from "../error/AlreadyHasActiveConnectionError";

export class ConnectionManager {

    protected readonly connections: Connection[] = [];

    has(name: string): boolean {
        return !!this.connections.find(connection => connection.name === name);
    }

    get(name: string = "default"): Connection {
        const connection = this.connections.find(connection => connection.name === name);
        if (!connection)
            throw new ConnectionNotFoundError(name);

        return connection;
    }

    create(options: ConnectionOptions): Connection {

        // check if such connection is already registered
        const existConnection = this.connections.find(connection => connection.name === (options.name || "default"));
        if (existConnection) {

            // if connection is registered and its not closed then throw an error
            if (existConnection.isConnected)
                throw new AlreadyHasActiveConnectionError(options.name || "default");

            // if its registered but closed then simply remove it from the manager
            this.connections.splice(this.connections.indexOf(existConnection), 1);
        }

        // create a new connection
        const connection = new Connection(options);
        this.connections.push(connection);
        return connection;
    }

}
