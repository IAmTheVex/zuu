import {Column} from "../../../../../lib/decorator/columns/Column";
import {VersionColumn} from "../../../../../lib/decorator/columns/VersionColumn";

export class Subcounters {

    @VersionColumn()
    version: number;

    @Column()
    watches: number;

}