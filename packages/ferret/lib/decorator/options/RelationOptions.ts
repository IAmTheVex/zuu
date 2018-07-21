import {OnDeleteType} from "../../metadata/types/OnDeleteType";
import {OnUpdateType} from "../../metadata/types/OnUpdateType";

export interface RelationOptions {

    cascade?: boolean|("insert"|"update"|"remove")[];

    nullable?: boolean;

    onDelete?: OnDeleteType;

    onUpdate?: OnUpdateType;

    primary?: boolean;

    lazy?: boolean;

    eager?: boolean;

    persistence?: boolean;

}
