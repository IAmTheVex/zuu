import {Column} from "../../../../../lib/decorator/columns/Column";
import {CreateDateColumn} from "../../../../../lib/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../../lib/decorator/columns/UpdateDateColumn";
import {Subcounters} from "./Subcounters";

export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(() => Subcounters, { prefix: "subcnt" })
    subcounters: Subcounters;

    @CreateDateColumn()
    createdDate: Date;

    @UpdateDateColumn()
    updatedDate: Date;

}