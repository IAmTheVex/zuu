import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Post} from "./Post";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../../../lib/decorator/relations/JoinColumn";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post, post => post.counters.categories)
    @JoinColumn()
    posts: Post[];

    postIds: number[];

}