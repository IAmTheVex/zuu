import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {Post} from "./Post";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

    @ManyToOne(type => Post, post => post.counters.subcounters.watchedUsers)
    post: Post;

}