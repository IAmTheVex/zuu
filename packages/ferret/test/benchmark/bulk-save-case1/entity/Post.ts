import {Entity} from "../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../lib/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: "text" })
    text: string;

    @Column({ type: "int" })
    likesCount: number;

    @Column({ type: "int" })
    commentsCount: number;

    @Column({ type: "int" })
    watchesCount: number;

}