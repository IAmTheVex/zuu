import {JoinColumnOptions} from "./JoinColumnOptions";

export interface JoinTableOptions {

    name?: string;

    joinColumn?: JoinColumnOptions;

    inverseJoinColumn?: JoinColumnOptions;

    database?: string;

    schema?: string;

}
