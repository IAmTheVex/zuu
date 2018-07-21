import {Category} from "./Category";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {Column} from "../../../../../lib/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Category, category => category.post)
    categories: Category[]|null;

    @Column({
        default: "supervalue"
    })
    title: string;

}