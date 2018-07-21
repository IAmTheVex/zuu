import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Category} from "./Category";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";
import {Details} from "./Details";
import {Photo} from "./Photo";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Category, category => category.post, {
        nullable: true
    })
    @JoinColumn()
    category: Category;

    @OneToOne(type => Details, details => details.post, {
        nullable: false
    })
    @JoinColumn()
    details: Details;

    @OneToOne(type => Photo, photo => photo.post)
    photo: Photo;

}