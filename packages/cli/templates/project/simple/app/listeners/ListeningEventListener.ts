import { BootstrapEvents, ListeningEvent } from "@zuu/bootstrap";
import { AbstractEventListener, Debugger } from "@zuu/vet";

let tag = Debugger.tag("listening-event-listener");

export class ListeningEventListener extends AbstractEventListener<ListeningEvent> {
    public constructor() {
        super(BootstrapEvents.LISTENING);
    }

    public handle(event: ListeningEvent, prevent: () => void) {
        Debugger.log(tag`App's listening on *:${event.app.get("PORT")}`);
    }
}