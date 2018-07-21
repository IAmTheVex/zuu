import {OrderByCondition} from "../../find-options/OrderByCondition";

export interface EntityOptions {

    name?: string;

    orderBy?: OrderByCondition|((object: any) => OrderByCondition|any);

    engine?: string;

    database?: string;

    schema?: string;

    synchronize?: boolean;
}
