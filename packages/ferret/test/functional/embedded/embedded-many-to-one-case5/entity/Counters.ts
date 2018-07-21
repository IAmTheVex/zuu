import {Column} from "../../../../../lib/decorator/columns/Column";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {User} from "./User";
import {Subcounters} from "./Subcounters";

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

    @ManyToOne(type => User)
    @JoinColumn()
    likedUser: User;

}