import {Entity} from "../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../lib/decorator/columns/PrimaryColumn";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    postText: string;

    @Column()
    postTag: string;

}