import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {Category} from "./Category";

@Entity()
export class Post {

    @ManyToOne(type => Category, category => category.posts, {
        primary: true,
        cascade: ["insert"]
    })
    category: Category;

    @Column()
    title: string;

}