import {PrimaryGeneratedColumnType} from "../../driver/types/ColumnTypes";

export interface PrimaryGeneratedColumnNumericOptions {

    type?: PrimaryGeneratedColumnType;

    name?: string;

    comment?: string;

    zerofill?: boolean;

    unsigned?: boolean;

}
