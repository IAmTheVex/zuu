import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../../lib/decorator/relations/JoinColumn";
import {RelationId} from "../../../../../../lib/decorator/relations/RelationId";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @ManyToOne(type => Category)
    @JoinColumn()
    category: Category;

    @ManyToOne(type => Category)
    @JoinColumn({ referencedColumnName: "name" })
    categoryByName: Category;

    @RelationId((post: Post) => post.category)
    categoryId: number;

    @RelationId((post: Post) => post.categoryByName)
    categoryName: string;

}