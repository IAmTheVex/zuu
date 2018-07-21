import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../lib/decorator/relations/JoinTable";
import {RelationCount} from "../../../../../../lib/decorator/relations/RelationCount";
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

    @RelationCount((post: Post) => post.categories)
    categoryCount: number;

    @RelationCount((post: Post) => post.categories, "removedCategories", qb => qb.andWhere("removedCategories.isRemoved = :isRemoved", { isRemoved: true }))
    removedCategoryCount: number;

}