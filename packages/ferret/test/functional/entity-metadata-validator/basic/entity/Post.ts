import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {RelationCount} from "../../../../../lib/decorator/relations/RelationCount";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @OneToOne(type => Category)
    category: Category;

    @ManyToMany(type => Category)
    category2: Category;

    @RelationCount((post: Post) => post.category)
    categoryCount: number;

    @RelationCount((post: Post) => post.category2)
    categoryCount2: number;

}