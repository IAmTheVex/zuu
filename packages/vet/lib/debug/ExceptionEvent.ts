import { AbstractEvent, AbstractEventListener } from "../event";

export class ExceptionEvent extends AbstractEvent {
    public static eventName: string = "zuu.debug.exception";

    private error:  Error;

    constructor(e: Error) {
        super(ExceptionEvent.eventName);
        this.error = e;
    }

    public expose(): Error {
        return this.error;
    }
}

export abstract class ExceptionEventListener extends AbstractEventListener<ExceptionEvent> {
    constructor() {
        super(ExceptionEvent.eventName);
    }

    public abstract handle(event: ExceptionEvent, prevent: () => void);
}