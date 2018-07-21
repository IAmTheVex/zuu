import {ManyToMany} from "../../../../../../lib/decorator/relations/ManyToMany";
import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {JoinTable} from "../../../../../../lib/decorator/relations/JoinTable";
import {RelationId} from "../../../../../../lib/decorator/relations/RelationId";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToMany(type => Category, category => category.posts)
    @JoinTable()
    categories: Category[];

    @ManyToMany(type => Category)
    @JoinTable()
    subcategories: Category[];

    @RelationId((post: Post) => post.categories)
    categoryIds: number[];

    @RelationId((post: Post) => post.categories, "rc", qb => qb.andWhere("rc.isRemoved = :isRemoved", { isRemoved: true }))
    removedCategoryIds: number[];

    @RelationId((post: Post) => post.subcategories)
    subcategoryIds: number[];

    @RelationId((post: Post) => post.subcategories, "rsc", qb => qb.andWhere("rsc.isRemoved = :isRemoved", { isRemoved: true }))
    removedSubcategoryIds: number[];

}