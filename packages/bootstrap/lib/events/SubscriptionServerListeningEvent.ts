import { AbstractEvent } from "@zuu/vet";
import { BootstrapEvents } from ".";
import { SubscriptionServer } from "subscriptions-transport-ws";

export class SubscriptionServerListeningEvent extends AbstractEvent {
    public server: SubscriptionServer;

    constructor(app: SubscriptionServer) { 
        super(BootstrapEvents.SUBSCRIPTION_SERVER_LISTENING); 
        this.server = app;
    }   
}