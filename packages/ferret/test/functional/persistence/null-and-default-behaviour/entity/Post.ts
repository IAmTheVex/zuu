import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: String, default: "hello default value", nullable: true })
    title?: string|null;

}