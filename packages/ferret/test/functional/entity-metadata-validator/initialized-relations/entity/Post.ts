import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {Category} from "./Category";
import {JoinTable} from "../../../../../lib/decorator/relations/JoinTable";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Category)
    @JoinColumn()
    category: Category;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[] = [];

}