import { ITask } from "./ITask";

export abstract class AbstractTask implements ITask {
    private _name: string;
    private _instance: Object;
    private _executor: (...args: any[]) => Promise<any>;

    public constructor(name: string, instance: Object, executor: (...args: any[]) => Promise<any>) {
        this._name = name;
        this._instance = instance;
        this._executor = this._executor;
    }

    public name(): string {
        return this._name;
    }

    public instance(): Object {
        return this._instance;
    }

    execute(): (...args: any[]) => Promise<any> {
        return this._executor;
    }
}