export class Timer {
    private start: number;
    private end: number;

    public reset(): Timer {
        this.start = Date.now();
        this.end = -1;

        return this;
    }

    public stop(): Timer {
        this.end = Date.now();

        return this;
    }

    public diff(): number {
        return this.end - this.start;
    }
}