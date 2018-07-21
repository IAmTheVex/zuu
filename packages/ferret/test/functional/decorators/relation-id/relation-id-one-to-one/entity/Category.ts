import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {Post} from "./Post";
import {RelationId} from "../../../../../../lib/decorator/relations/RelationId";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @OneToOne(type => Post, post => post.category2)
    post: Post;

    @RelationId((category: Category) => category.post)
    postId: number;

}