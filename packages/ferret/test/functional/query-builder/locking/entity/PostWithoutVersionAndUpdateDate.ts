import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";

@Entity("post_without_v_ud")
export class PostWithoutVersionAndUpdateDate {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

}