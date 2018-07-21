import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";
import {Post} from "./Post";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post)
    @JoinColumn()
    likedPost: Post;

}