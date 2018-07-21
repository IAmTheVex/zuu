import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";

@Entity()
export class PostMultiplePrimaryKeys {

    @PrimaryColumn()
    firstId: number;

    @PrimaryColumn()
    secondId: number;

    @Column({ default: "Hello Multi Ids" })
    text: string;

}