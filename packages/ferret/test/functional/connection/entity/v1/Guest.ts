import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {Comment} from "./Comment";

@Entity()
export class Guest {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @OneToMany(type => Comment, comment => comment.author)
    comments: Comment[];
}