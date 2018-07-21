import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";
import {Category} from "./Category";

@Entity()
export class Image {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Category, category => category.image)
    categories: Category[];

    categoryIds: number[];

}