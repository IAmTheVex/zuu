import {ValueTransformer} from "./ValueTransformer";

export interface ColumnCommonOptions {

    select?: boolean;

    name?: string;

    primary?: boolean;

    generated?: boolean;

    unique?: boolean;

    nullable?: boolean;

    default?: any;

    onUpdate?: string;

    comment?: string;

    array?: boolean;

    transformer?: ValueTransformer;

}
