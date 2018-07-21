import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {Generated} from "../../../../../lib/decorator/Generated";

@Entity()
export class Post {

    @PrimaryColumn("int", {name: "theId"})
    @Generated()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category, category => category.posts, {
        cascade: ["insert"]
    })
    category: Category;

}