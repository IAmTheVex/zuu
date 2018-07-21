import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../lib/decorator/relations/JoinTable";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {Category} from "./Category";
import {User} from "./User";
import {Photo} from "./Photo";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {Counters} from "./Counters";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Photo, photo => photo.post)
    photos: Photo[];

    @ManyToOne(type => User)
    user: User;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

    @Column(type => Counters)
    counters: Counters;

}