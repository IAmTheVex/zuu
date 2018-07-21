import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";
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

    @OneToMany(type => Category, category => category.post)
    categories: Category[];

    @Column(() => Subcounters)
    subcounters: Subcounters;

    categoryIds: number[];

}