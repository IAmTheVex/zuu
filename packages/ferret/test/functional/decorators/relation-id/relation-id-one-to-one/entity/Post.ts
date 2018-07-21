import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../lib/decorator/relations/JoinColumn";
import {Category} from "./Category";
import {RelationId} from "../../../../../../lib/decorator/relations/RelationId";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @OneToOne(type => Category)
    @JoinColumn()
    category: Category;

    @OneToOne(type => Category)
    @JoinColumn({ referencedColumnName: "name" })
    categoryByName: Category;

    @OneToOne(type => Category, category => category.post)
    @JoinColumn()
    category2: Category;

    @RelationId((post: Post) => post.category)
    categoryId: number;

    @RelationId((post: Post) => post.categoryByName)
    categoryName: string;

    @RelationId((post: Post) => post.category2)
    category2Id: number;

}