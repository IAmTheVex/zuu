import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {Post} from "./Post";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToMany(type => Post, post => post.counters.categories)
    posts: Post[];

    postIds: number[];

}