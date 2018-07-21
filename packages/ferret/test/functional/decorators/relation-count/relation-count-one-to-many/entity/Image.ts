import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";
import {Category} from "./Category";

@Entity()
export class Image {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToOne(type => Category, category => category.images)
    category: Category;

}