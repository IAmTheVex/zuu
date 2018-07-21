import {Column} from "../../../../../lib/decorator/columns/Column";
import {PostCounter} from "./PostCounter";
import {BeforeInsert} from "../../../../../lib/decorator/listeners/BeforeInsert";
import {Index} from "../../../../../lib/decorator/Index";

export class PostInformation {

    @Column()
    @Index()
    description: string;

    @Column(type => PostCounter, { prefix: "counters" } )
    counters: PostCounter = new PostCounter();

    @BeforeInsert()
    beforeInsert() {
        this.description = "default post description";
    }

}