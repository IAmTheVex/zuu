import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {Counters} from "./Counters";

@Entity()
export class Post {

    @Column()
    title: string;

    @Column(() => Counters, { prefix: "cnt" })
    counters: Counters;

}