import {Column} from "../../../../../../lib/decorator/columns/Column";
import {Information} from "./Information";

export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Column(type => Information)
    information: Information;

}