import {Entity} from "../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../lib/decorator/columns/Column";
import {Unique} from "../../../../lib/decorator/Unique";
import {PrimaryColumn} from "../../../../lib/decorator/columns/PrimaryColumn";
import {Check} from "../../../../lib/decorator/Check";

@Entity()
@Unique(["text", "tag"])
@Check(`"likesCount" < 1000`)
export class Post {

    @PrimaryColumn()
    id: number;

    @Column({ unique: true })
    version: string;

    @Column({ default: "My post" })
    name: string;

    @Column()
    text: string;

    @Column()
    tag: string;

    @Column()
    likesCount: number;

}