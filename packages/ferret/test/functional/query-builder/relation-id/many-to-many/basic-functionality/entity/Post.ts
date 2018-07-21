import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {JoinTable} from "../../../../../../../lib/decorator/relations/JoinTable";
import {Category} from "./Category";
import {Tag} from "./Tag";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @ManyToOne(type => Tag)
    tag: Tag;
    
    tagId: number;

    @ManyToMany(type => Category, category => category.posts)
    @JoinTable()
    categories: Category[];

    @ManyToMany(type => Category)
    @JoinTable()
    subcategories: Category[];
    
    categoryIds: number[];

}