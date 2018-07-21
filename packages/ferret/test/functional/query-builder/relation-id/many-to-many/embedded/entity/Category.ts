import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Post} from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Post, post => post.counters.categories)
    posts: Post[];

    postIds: number[];

}