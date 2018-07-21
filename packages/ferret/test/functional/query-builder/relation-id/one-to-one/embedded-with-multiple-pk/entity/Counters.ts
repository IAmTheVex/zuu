import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {OneToOne} from "../../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../../lib/decorator/relations/JoinColumn";
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

    @OneToOne(type => Category)
    @JoinColumn()
    category: Category;

    @Column(() => Subcounters)
    subcounters: Subcounters;

    categoryId: number[];

}