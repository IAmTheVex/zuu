import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../../lib/decorator/relations/OneToMany";
import {RelationCount} from "../../../../../../lib/decorator/relations/RelationCount";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @OneToMany(type => Category, category => category.post)
    categories: Category[];

    @RelationCount((post: Post) => post.categories)
    categoryCount: number;

    @RelationCount((post: Post) => post.categories, "rc", qb => qb.andWhere("rc.isRemoved = :isRemoved", { isRemoved: true }))
    removedCategoryCount: number;

}