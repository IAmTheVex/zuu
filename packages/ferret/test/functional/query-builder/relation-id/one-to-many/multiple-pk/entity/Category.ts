import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";
import {Post} from "./Post";
import {Image} from "./Image";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;

    @OneToMany(type => Image, image => image.category)
    images: Image[];

    postId: number;

    imageIds: number[];

}