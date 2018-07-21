import {Category} from "./Category";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post, { cascade: ["insert"] })
    categories: Category[];

}