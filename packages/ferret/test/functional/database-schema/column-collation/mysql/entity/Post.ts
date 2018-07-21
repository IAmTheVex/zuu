import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column({ collation: "ascii_general_ci" })
    name: string;

    @Column({ charset: "utf8" })
    title: string;

    @Column({ charset: "cp852", collation: "cp852_general_ci" })
    description: string;

}