import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../../../lib/decorator/relations/JoinColumn";
import {Post} from "./Post";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post, post => post.counters.subcounters.watchedUsers)
    @JoinColumn()
    posts: Post[];

}