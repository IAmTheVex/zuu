import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column("char", {
        length: 50
    })
    char: string;

    @Column("varchar", {
        length: 50
    })
    varchar: string;

}