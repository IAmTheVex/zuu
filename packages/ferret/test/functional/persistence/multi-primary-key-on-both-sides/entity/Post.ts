import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryColumn("int")
    firstId: number;

    @PrimaryColumn("int")
    secondId: number;

    @Column()
    title: string;

    @ManyToOne(type => Category, category => category.posts)
    category: Category;

}