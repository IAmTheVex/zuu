import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {Category} from "./Category";
import {JoinTable} from "../../../../../lib/decorator/relations/JoinTable";

@Entity()
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToMany(type => Category, { persistence: false })
    @JoinTable()
    categories: Category[] = [];

}