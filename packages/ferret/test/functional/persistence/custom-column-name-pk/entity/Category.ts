import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Post} from "./Post";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {Generated} from "../../../../../lib/decorator/Generated";

@Entity()
export class Category {

    @PrimaryColumn("int", {name: "theId"})
    @Generated()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.category, {
        cascade: ["insert"]
    })
    posts: Post[];

}