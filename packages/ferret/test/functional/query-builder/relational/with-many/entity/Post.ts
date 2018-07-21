import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {Image} from "./Image";
import {ManyToMany} from "../../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../lib/decorator/relations/JoinTable";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category, category => category.posts)
    category: Category;

    @ManyToMany(type => Image, image => image.posts)
    @JoinTable()
    images: Image[];

}