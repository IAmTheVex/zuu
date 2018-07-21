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

    @Column("uuid")
    uuid2: string;

    @Column("uuid", { nullable: true })
    uuid3: string|null;

    @Column({ nullable: true })
    @Generated("uuid")
    uuid4: string|null;

}