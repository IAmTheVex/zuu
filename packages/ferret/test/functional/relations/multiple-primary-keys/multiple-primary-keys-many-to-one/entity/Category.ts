import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../../lib/decorator/relations/OneToMany";
import {Post} from "./Post";
import {Unique} from "../../../../../../lib";

@Entity()
@Unique(["code", "version", "description"])
export class Category {

    @PrimaryColumn()
    name: string;

    @PrimaryColumn()
    type: string;

    @Column()
    code: number;

    @Column()
    version: number;

    @Column({nullable: true})
    description: string;

    @OneToMany(type => Post, post => post.category)
    posts: Post[];

    @OneToMany(type => Post, post => post.categoryWithJoinColumn)
    postsWithJoinColumn: Post[];

    @OneToMany(type => Post, post => post.categoryWithOptions)
    postsWithOptions: Post[];

    @OneToMany(type => Post, post => post.categoryWithNonPKColumns)
    postsWithNonPKColumns: Post[];

}