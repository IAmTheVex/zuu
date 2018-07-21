import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {Subcounters} from "./Subcounters";

export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @ManyToOne(type => Category, category => category.posts)
    category: Category;

    @Column(() => Subcounters)
    subcounters: Subcounters;

    categoryId: number;

}