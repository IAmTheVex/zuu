import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Counters} from "./Counters";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column(() => Counters)
    counters: Counters;

}