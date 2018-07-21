import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Counters} from "./Counters";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column(() => Counters)
    counters: Counters;

}
