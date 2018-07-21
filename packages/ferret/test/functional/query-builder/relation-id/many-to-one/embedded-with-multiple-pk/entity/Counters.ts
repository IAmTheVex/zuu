import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
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

    @ManyToOne(type => Category)
    category: Category;

    @Column(() => Subcounters)
    subcounters: Subcounters;

    categoryId: number[];

}