import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../lib/decorator/relations/JoinTable";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";
import {User} from "./User";
import {Category} from "./Category";
import {Tag} from "./Tag";
import {Image} from "./Image";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @ManyToOne(type => Tag)
    tag: Tag;

    @OneToOne(type => User)
    @JoinColumn()
    author: User;

    @ManyToMany(type => Category, category => category.posts)
    @JoinTable()
    categories: Category[];

    subcategories: Category[];

    removedCategories: Category[];

    images: Image[];

}