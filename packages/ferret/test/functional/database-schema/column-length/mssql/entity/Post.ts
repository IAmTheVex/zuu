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

    @Column("nchar", {
        length: 50
    })
    nchar: string;

    @Column("nvarchar", {
        length: 50
    })
    nvarchar: string;

    @Column("binary", {
        length: 50
    })
    binary: Buffer;

    @Column("varbinary", {
        length: 50
    })
    varbinary: Buffer;

}