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
    boolean: boolean;

    @Column()
    blob: Buffer;

    @Column()
    datetime: Date;

}