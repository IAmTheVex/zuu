import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../lib/decorator/relations/JoinTable";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Subcounters} from "./Subcounters";
import {User} from "./User";

export class Counters {

    @PrimaryColumn()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(() => Subcounters, { prefix: "subcnt" })
    subcounters: Subcounters;

    @ManyToMany(type => User, user => user.likedPosts)
    @JoinTable()
    likedUsers: User[];

}