import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {Category} from "./Category";
import {Subcounters} from "./Subcounters";
import {OneToOne} from "../../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../../lib/decorator/relations/JoinColumn";

export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @OneToOne(type => Category, category => category.post)
    @JoinColumn()
    category: Category;

    @Column(() => Subcounters)
    subcounters: Subcounters;

    categoryId: number;

}