import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../../lib/decorator/relations/JoinColumn";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @OneToOne(type => Category)
    @JoinColumn()
    category: Category;

    @OneToOne(type => Category, category => category.post)
    @JoinColumn()
    category2: Category;
    
    categoryId: number;

}