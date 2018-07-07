import { AbstractEvent } from "./AbstractEvent";

export abstract class AbstractEventListener<T extends AbstractEvent> {
    public name: string;

    constructor(name: string) {
        this.name = name;
    }

    public abstract handle(event: T, prevent: () => void);
}