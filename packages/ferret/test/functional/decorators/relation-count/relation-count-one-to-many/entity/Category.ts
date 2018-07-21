import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";
import {OneToMany} from "../../../../../../lib/decorator/relations/OneToMany";
import {RelationCount} from "../../../../../../lib/decorator/relations/RelationCount";
import {Image} from "./Image";
import {Post} from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;

    @OneToMany(type => Image, image => image.category)
    images: Image[];

    @RelationCount((category: Category) => category.images)
    imageCount: number;

    @RelationCount((category: Category) => category.images, "removedImages", qb => qb.andWhere("removedImages.isRemoved = :isRemoved", { isRemoved: true }))
    removedImageCount: number;

}