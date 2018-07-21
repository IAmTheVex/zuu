import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {Category} from "./Category";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    authorId: number;

    @Column()
    title: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToOne(type => Category, category => category.posts)
    category: Category;

    @ManyToOne(type => Category)
    subcategory: Category;
    
    categoryId: number;

}