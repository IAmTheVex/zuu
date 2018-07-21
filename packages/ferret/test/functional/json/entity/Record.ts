import {Entity} from "../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../lib/decorator/columns/Column";

/**
 * For testing Postgres jsonb
 */
@Entity()
export class Record {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "json", nullable: true })
    config: any;

    @Column({ type: "jsonb", nullable: true })
    data: any;

}