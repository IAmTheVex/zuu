export interface ITask {
    name(): string;
    instance(): Object;
    execute(): (...args: any[]) => Promise<any>;
}