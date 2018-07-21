import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {JoinTable} from "../../../../../../../lib/decorator/relations/JoinTable";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
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

    @OneToMany(type => Post, post => post.category)
    posts: Post[];

    @ManyToOne(type => Image, image => image.categories)
    @JoinTable()
    image: Image;

    postIds: number[];

    imageId: number[];

}