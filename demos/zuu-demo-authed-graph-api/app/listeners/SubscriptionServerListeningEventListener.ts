import { SubscriptionServerListeningEvent, BootstrapEvents, GQLHelper } from "@zuu/bootstrap";
import { AbstractEventListener, Debugger } from "@zuu/vet";

let tag = Debugger.tag("subscription-server-listening-event-listener");

export class SubscriptionServerListeningEventListener extends AbstractEventListener<SubscriptionServerListeningEvent> {
    public constructor() {
        super(BootstrapEvents.SUBSCRIPTION_SERVER_LISTENING);
    }
    public handle(event: SubscriptionServerListeningEvent, prevent: () => void) {
        Debugger.log(tag`Subscriptions are available under wss://*:*${GQLHelper.subscriptionsPath}`);
    }
}
