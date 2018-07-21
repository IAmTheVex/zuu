import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {Category} from "./Category";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    authorId: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post)
    categories: Category[];
    
    categoryIds: number[];

}