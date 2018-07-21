import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../lib/decorator/relations/JoinTable";
import {Post} from "./Post";
import {Image} from "./Image";
import {RelationId} from "../../../../../../lib/decorator/relations/RelationId";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToMany(type => Post, post => post.categories)
    posts: Post[];

    @ManyToMany(type => Image)
    @JoinTable()
    images: Image[];

    @RelationId((category: Category) => category.images)
    imageIds: number[];

    @RelationId((category: Category) => category.images, "removedImages", qb => qb.andWhere("removedImages.isRemoved = :isRemoved", { isRemoved: true }))
    removedImageIds: number[];

    @RelationId((category: Category) => category.posts)
    postIds: number[];

    @RelationId((category: Category) => category.posts, "removedPosts", qb => qb.andWhere("removedPosts.isRemoved = :isRemoved", { isRemoved: true }))
    removedPostIds: number[];

}