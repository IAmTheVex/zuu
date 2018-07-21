import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../../lib/decorator/relations/JoinTable";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {Category} from "./Category";
import {Subcounters} from "./Subcounters";

export class Counters {

    @PrimaryColumn()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @ManyToMany(type => Category, category => category.posts)
    @JoinTable({ name: "counter_categories" })
    categories: Category[];

    @Column(() => Subcounters)
    subcntrs: Subcounters;

    categoryIds: number[];

}