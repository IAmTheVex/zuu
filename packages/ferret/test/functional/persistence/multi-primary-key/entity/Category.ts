import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Post} from "./Post";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {Generated} from "../../../../../lib/decorator/Generated";


@Entity()
export class Category {

    @PrimaryColumn("int")
    @Generated()
    categoryId: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.category)
    posts: Post[];

}