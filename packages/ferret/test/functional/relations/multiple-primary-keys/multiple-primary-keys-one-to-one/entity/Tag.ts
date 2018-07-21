import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../lib/decorator/relations/JoinColumn";
import {Category} from "./Category";

@Entity()
export class Tag {

    @Column()
    code: number;

    @PrimaryColumn()
    title: string;

    @PrimaryColumn()
    description: string;

    @OneToOne(type => Category, category => category.tag)
    @JoinColumn()
    category: Category;

    @OneToOne(type => Category, category => category.tagWithOptions)
    @JoinColumn([
        { name: "category_name", referencedColumnName: "name" },
        { name: "category_type", referencedColumnName: "type" }
    ])
    categoryWithOptions: Category;

    @OneToOne(type => Category, category => category.tagWithNonPKColumns)
    @JoinColumn([
        { name: "category_code", referencedColumnName: "code" },
        { name: "category_version", referencedColumnName: "version" },
        { name: "category_description", referencedColumnName: "description" }
    ])
    categoryWithNonPKColumns: Category;

}