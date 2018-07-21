import {Category} from "./Category";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column("int", { nullable: true })
    categoryId: number;

    @ManyToOne(type => Category, category => category.posts, {
        cascade: true
    })
    @JoinColumn({ name: "categoryId" })
    category: Category;

}