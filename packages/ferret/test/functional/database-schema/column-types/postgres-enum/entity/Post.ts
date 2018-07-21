import {Column} from "../../../../../../lib/decorator/columns/Column";
import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { enum: ["A", "B", "C"] })
    enum: string;

    @Column()
    name: string;
}