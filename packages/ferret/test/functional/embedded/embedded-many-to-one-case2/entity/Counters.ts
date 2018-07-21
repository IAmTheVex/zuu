import {Column} from "../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {User} from "./User";
import {Subcounters} from "./Subcounters";

export class Counters {

    @Column()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(() => Subcounters, { prefix: "subcnt" })
    subcounters: Subcounters;

    @OneToMany(type => User, user => user.likedPost)
    likedUsers: User[];

}