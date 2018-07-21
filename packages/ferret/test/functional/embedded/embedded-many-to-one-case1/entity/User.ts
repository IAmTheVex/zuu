import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {Post} from "./Post";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.counters.likedUser)
    likedPosts: Post[];

}