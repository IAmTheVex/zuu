import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Generated} from "../../../../../lib/decorator/Generated";

@Entity()
export class Question {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    @Generated("uuid")
    uuid: string;

    @Column("uniqueidentifier", { nullable: true })
    uuid2: string|null;

    @Column("uniqueidentifier", { nullable: true })
    @Generated("uuid")
    uuid3: string|null;

}