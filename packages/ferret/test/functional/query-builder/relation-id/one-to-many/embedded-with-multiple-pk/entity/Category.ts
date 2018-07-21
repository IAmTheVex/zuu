import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {Post} from "./Post";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToOne(type => Post, post => post.counters.categories)
    post: Post;

}