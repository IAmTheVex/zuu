import { LoadType } from "./LoadType";

export abstract class AbstractModule {
    public types: LoadType[];

    protected constructor(types: LoadType[]) {
        this.types = types;
    }
}