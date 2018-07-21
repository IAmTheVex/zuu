import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../lib/decorator/relations/JoinTable";
import {RelationCount} from "../../../../../../lib/decorator/relations/RelationCount";
import {Post} from "./Post";
import {Image} from "./Image";

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

    @ManyToMany(type => Image, image => image.categories)
    @JoinTable()
    images: Image[];

    @RelationCount((category: Category) => category.posts)
    postCount: number;

    @RelationCount((category: Category) => category.posts, "removedPosts", qb => qb.andWhere("removedPosts.isRemoved = :isRemoved", { isRemoved: true }))
    removedPostCount: number;

    @RelationCount((category: Category) => category.images)
    imageCount: number;

    @RelationCount((category: Category) => category.images, "removedImages", qb => qb.andWhere("removedImages.isRemoved = :isRemoved", { isRemoved: true }))
    removedImageCount: number;

}