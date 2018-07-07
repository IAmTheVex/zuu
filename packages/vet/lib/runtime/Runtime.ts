import { ITask } from "./task/ITask";
import { Debugger } from "../debug";
import { Time } from "..";

export class Runtime {
    private static tasks: Map<string, ITask> = new Map<string, ITask>();

    public static bake(instance: ITask) {
        this.tasks.set(instance.name(), instance);
    }    

    public static task(name: string, ...args: any[]): Promise<any> {
        let task: ITask = this.tasks.get(name);
        if(!task) return null;
        return this.scoped(task.instance(), task.execute(), args);
    }

    public static scoped(instance: Object, t: (...args: any[]) => Promise<any>, ...args: any[]): Promise<any> {
        return new Promise(resolve => {
            (async _ => {
                return await t.apply(instance, args);
            })().catch((e: Error) => {
                Debugger.error(e);
            }).then(result => { if(typeof result != "undefined") resolve(result); });
        });
    }

    public static delay(ms: number | string): Promise<void> {
        if(typeof ms == "string") ms = Time.parse(ms);
        return new Promise(resolve => {
            setTimeout(_ => {
                return resolve();
            }, ms);
        });
    }
};