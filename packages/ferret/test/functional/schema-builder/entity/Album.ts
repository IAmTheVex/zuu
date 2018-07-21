import {Entity} from "../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../lib/decorator/columns/PrimaryColumn";

@Entity({ synchronize: false })
export class Album {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

}