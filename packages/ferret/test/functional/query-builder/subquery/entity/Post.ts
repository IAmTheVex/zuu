import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Category} from "./Category";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../lib/decorator/relations/JoinTable";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}