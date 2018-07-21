import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {Category} from "./Category";
import {Subcounters} from "./Subcounters";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";

export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @OneToMany(type => Category, category => category.posts)
    categories: Category[];

    @Column(() => Subcounters)
    subcounters: Subcounters;

    categoryIds: number[];

}