import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";

@Entity()
export class PostUuid {

    @PrimaryGeneratedColumn("uuid")
    id: number;

    @Column()
    text: string;

}