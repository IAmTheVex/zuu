import { EventBus } from "../event";
import { ExceptionEvent, LogEvent } from ".";

import { ExceptionEventListener } from "./ExceptionEvent";
import { LogEventListener } from "./LogEvent";

class _DefaultExceptionEventListener extends ExceptionEventListener {
    public handle(event: ExceptionEvent, prevent: () => void) {
        console.error("[" + new Date().toLocaleString("en-US") + "] " + event.expose().stack);
    }
}

class _DefaultLogEventListener extends LogEventListener {
    public handle(event: LogEvent, prevent: () => void) {
        console.log("[" + new Date().toLocaleString("en-US") + "]", ...event.expose());
    }
}

export class Debugger {
    public static deafults() {
        EventBus.subscribe(new _DefaultExceptionEventListener);
        EventBus.subscribe(new _DefaultLogEventListener);
    }
    
    public static error(e: Error) {
        EventBus.emit(new ExceptionEvent(e));
    }

    public static log(...messages: any[]) {
        if(messages.length == 1 && Array.isArray(messages[0])) {
            messages = messages[0];
        }
        EventBus.emit(new LogEvent(messages));
    }

    public static tag(value: string): (...messages: any[]) => any[] {
        return (messages: string[], values: any[] = []) => {
            if(!(values instanceof Array)) {
                values = [values];
            }
            
            let message = [messages[0]];
            if(values) {
                for(let index = 0; index < values.length; index++) {
                    message.push(values[index]);
                    message.push(messages[index + 1]);
                }
            }
            return [`(${value})`, message.join('')];
        }
    }
}