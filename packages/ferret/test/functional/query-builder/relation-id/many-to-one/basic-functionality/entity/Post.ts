import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../../../lib/decorator/relations/JoinColumn";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";
import {Category} from "./Category";
import {PostCategory} from "./PostCategory";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @ManyToOne(type => Category)
    @JoinColumn({ referencedColumnName: "name" })
    categoryByName: Category;

    @ManyToOne(type => Category)
    @JoinColumn()
    category: Category;

    @OneToMany(type => PostCategory, postCategoryRelation => postCategoryRelation.post)
    categories: PostCategory[];

    categoryId: number;

    categoryName: string;

}