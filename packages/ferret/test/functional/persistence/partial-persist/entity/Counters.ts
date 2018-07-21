import {Column} from "../../../../../lib/decorator/columns/Column";

export class Counters {

    @Column()
    stars: number;

    @Column()
    commentCount: number;

    @Column()
    metadata: string;

}