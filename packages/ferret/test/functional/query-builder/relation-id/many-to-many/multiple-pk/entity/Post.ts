import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {JoinTable} from "../../../../../../../lib/decorator/relations/JoinTable";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {Category} from "./Category";

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

    @ManyToMany(type => Category, category => category.posts)
    @JoinTable()
    categories: Category[];

    @ManyToMany(type => Category)
    @JoinTable()
    subcategories: Category[];
    
    categoryIds: number[];

}