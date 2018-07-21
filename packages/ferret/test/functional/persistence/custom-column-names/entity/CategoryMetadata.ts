import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {Category} from "./Category";

@Entity()
export class CategoryMetadata {

    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    keyword: string;

    @OneToOne(type => Category, category => category.metadata)
    category: Category;

}