import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PostEmbedded} from "./PostEmbedded";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";

@Entity()
export class PostComplex {

    @PrimaryColumn()
    firstId: number;

    @Column({ default: "Hello Complexity" })
    text: string;

    @Column(type => PostEmbedded)
    embed: PostEmbedded;

}