import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {Category} from "./Category";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {User} from "./User";
import {JoinTable} from "../../../../../lib/decorator/relations/JoinTable";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => User)
    author: User;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}