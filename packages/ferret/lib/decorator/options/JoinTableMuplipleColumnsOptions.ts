import {JoinColumnOptions} from "./JoinColumnOptions";

export interface JoinTableMultipleColumnsOptions {

    name?: string;

    joinColumns?: JoinColumnOptions[];

    inverseJoinColumns?: JoinColumnOptions[];

    database?: string;
    
    schema?: string;

}
