import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../../lib/decorator/columns/Column";

@Entity()
export class Image {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}