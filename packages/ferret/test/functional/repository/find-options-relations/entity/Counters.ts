import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {User} from "./User";

export class Counters {

    @Column()
    stars: number;

    @Column()
    commentCount: number;

    @ManyToOne(type => User)
    author: User;

}