import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Post} from "./Post";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(() => Post, post => post.counters.likedUser)
    likedPost: Post;

}