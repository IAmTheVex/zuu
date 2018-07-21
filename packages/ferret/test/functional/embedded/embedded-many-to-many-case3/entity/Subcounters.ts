import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";

export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

}