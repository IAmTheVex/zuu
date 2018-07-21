import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";

@Entity()
export class PostWithoutTypes {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    bit: boolean;

    @Column()
    binary: Buffer;

    @Column()
    datetime: Date;

}