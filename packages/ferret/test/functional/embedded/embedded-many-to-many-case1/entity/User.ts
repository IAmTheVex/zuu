import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {Post} from "./Post";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.counters.likedUsers)
    likedPosts: Post[];

}