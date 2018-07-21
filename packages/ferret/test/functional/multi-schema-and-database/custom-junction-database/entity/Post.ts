import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../lib/decorator/relations/JoinTable";
import {Category} from "./Category";

@Entity({
    database: "yoman"
})
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Category)
    @JoinTable({ database: "yoman" })
    categories: Category[];

}