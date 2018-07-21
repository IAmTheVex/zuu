import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../../lib/decorator/relations/OneToMany";
import {RelationId} from "../../../../../../lib/decorator/relations/RelationId";
import {Post} from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.category)
    posts: Post[];

    @RelationId((category: Category) => category.posts)
    postIds: number[];

    @RelationId((category: Category) => category.posts, "removedPosts", qb => qb.andWhere("removedPosts.isRemoved = :isRemoved", { isRemoved: true }))
    removedPostIds: number[];

}