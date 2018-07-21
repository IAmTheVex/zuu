import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";

export class Counters {

    @PrimaryColumn()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

}