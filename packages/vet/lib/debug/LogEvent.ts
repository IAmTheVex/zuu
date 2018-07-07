import { AbstractEvent, AbstractEventListener } from "../event";

export class LogEvent extends AbstractEvent {
    public static eventName: string = "zuu.debug.log";

    private messages:  any[];

    constructor(messages: any[]) {
        super(LogEvent.eventName);
        this.messages = messages;
    }

    public expose(): any[] {
        return this.messages;
    }
}

export abstract class LogEventListener extends AbstractEventListener<LogEvent> {
    constructor() {
        super(LogEvent.eventName);
    }

    public abstract handle(event: LogEvent, prevent: () => void);
}