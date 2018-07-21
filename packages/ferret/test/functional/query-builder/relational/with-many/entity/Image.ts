import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {Post} from "./Post";
import {ManyToMany} from "../../../../../../lib/decorator/relations/ManyToMany";

@Entity()
export class Image {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @ManyToMany(type => Post, post => post.images)
    posts: Post[];

}