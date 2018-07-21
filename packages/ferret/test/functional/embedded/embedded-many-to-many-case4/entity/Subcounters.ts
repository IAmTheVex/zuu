import {Column} from "../../../../../lib/decorator/columns/Column";

export class Subcounters {

    @Column()
    version: number;

    @Column()
    watches: number;

}