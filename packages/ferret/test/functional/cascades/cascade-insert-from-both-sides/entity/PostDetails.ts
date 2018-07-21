import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Post} from "./Post";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";

@Entity()
export class PostDetails {

    @PrimaryColumn()
    keyword: string;

    @OneToOne(type => Post, post => post.details, {
        cascade: ["insert"]
    })
    post: Post;

}