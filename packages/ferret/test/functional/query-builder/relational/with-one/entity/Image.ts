import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {Post} from "./Post";

@Entity()
export class Image {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @OneToOne(type => Post, post => post.image)
    post: Post;

}