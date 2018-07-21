import {ColumnType} from "../../driver/types/ColumnTypes";
import {ValueTransformer} from "./ValueTransformer";

export interface ColumnOptions {

    type?: ColumnType;

    name?: string;

    length?: string|number;

    width?: number;

    nullable?: boolean;

    readonly?: boolean;

    select?: boolean;

    default?: any;

    onUpdate?: string;

    primary?: boolean;

    unique?: boolean;

    comment?: string;

    precision?: number|null;

    scale?: number;

    zerofill?: boolean;

    unsigned?: boolean;

    charset?: string;

    collation?: string;

    enum?: any[]|Object;

    asExpression?: string;

    generatedType?: "VIRTUAL"|"STORED";

    hstoreType?: "object"|"string";

    array?: boolean;

    transformer?: ValueTransformer;
    
}
