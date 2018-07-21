import {Column} from "../../../../../lib/decorator/columns/Column";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Post} from "./Post";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    personId: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.counters.likedUsers)
    likedPosts: Post[];

}