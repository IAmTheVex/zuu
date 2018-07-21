import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {Post} from "./Post";
import {Photo} from "./Photo";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";

@Entity()
export class Details {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Post, post => post.details)
    post: Post;

    @OneToOne(type => Photo, photo => photo.details, {
        nullable: false
    })
    @JoinColumn()
    photo: Photo;

}