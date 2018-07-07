import { Connection } from "@zuu/ferret";
import { AbstractEvent } from "@zuu/vet";
import { BootstrapEvents } from ".";

export class ConnectionCreatedEvent extends AbstractEvent {
    public connection: Connection;
    public constructor(connection: Connection) {
        super(BootstrapEvents.CONNECTION_CREATED);
        this.connection = connection;
    }
}