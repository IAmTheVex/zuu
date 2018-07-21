import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";

@Entity()
export class Record {

    @PrimaryGeneratedColumn("uuid")
    id: string;

}