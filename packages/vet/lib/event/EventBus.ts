import { AbstractEventListener } from "./AbstractEventListener";
import { AbstractEvent } from "./AbstractEvent";
export class EventBus {
    private static listeners: Map<string, AbstractEventListener<AbstractEvent>[]> = new Map<string, AbstractEventListener<AbstractEvent>[]>(); 

    public static subscribe<T extends AbstractEvent>(listener: AbstractEventListener<T>) {
        let list = this.listeners.get(listener.name) || [];
        list.push(listener);
        this.listeners.set(listener.name, list);
    }

    public static emit(event: AbstractEvent) {
        let list = this.listeners.get(event.name) || [];        
        let shouldContinue = true;
        for(let i = 0; i < list.length; i++) {
            list[i].handle(event, () => { shouldContinue = false; });
            if(!shouldContinue) break;
        }
    }
};