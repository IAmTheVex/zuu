import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Post} from "./Post";
import {OneToOne} from "../../../../../../../lib/decorator/relations/OneToOne";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.counters.category)
    post: Post;

    postId: number;

}