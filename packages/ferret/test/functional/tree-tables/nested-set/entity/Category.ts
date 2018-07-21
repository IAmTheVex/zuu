import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {TreeParent} from "../../../../../lib/decorator/tree/TreeParent";
import {TreeChildren} from "../../../../../lib/decorator/tree/TreeChildren";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Tree} from "../../../../../lib/decorator/tree/Tree";

@Entity()
@Tree("nested-set")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @TreeParent()
    parentCategory: Category;

    @TreeChildren({ cascade: true })
    childCategories: Category[];

    // @TreeLevelColumn()
    // level: number;

}