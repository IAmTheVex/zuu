import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

}