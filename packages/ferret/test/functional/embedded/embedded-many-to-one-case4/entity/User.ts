import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Post} from "./Post";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    personId: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.counters.likedUser)
    likedPosts: Post[];

}