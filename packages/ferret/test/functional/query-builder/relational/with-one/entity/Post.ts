import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {Image} from "./Image";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../lib/decorator/relations/JoinColumn";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category)
    category: Category;

    @OneToOne(type => Image, image => image.post)
    @JoinColumn()
    image: Image;

}