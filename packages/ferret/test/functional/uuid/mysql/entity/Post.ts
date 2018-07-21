import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Generated} from "../../../../../lib/decorator/Generated";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Generated("uuid")
    uuid: string;

}