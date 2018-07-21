import { Entity } from "../../../../../../lib/decorator/entity/Entity";
import { PrimaryGeneratedColumn } from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import { Column } from "../../../../../../lib/decorator/columns/Column";
import { ManyToMany } from "../../../../../../lib/decorator/relations/ManyToMany";
import { OneToMany } from "../../../../../../lib/decorator/relations/OneToMany";
import { OneToOne } from "../../../../../../lib/decorator/relations/OneToOne";
import {
    Post,
} from "./Post";

@Entity("s_category", {
    orderBy: {
        id: "ASC",
    }
})
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.oneCategory)
    onePost: Promise<Post>;

    @ManyToMany(type => Post, post => post.twoSideCategories)
    twoSidePosts: Promise<Post[]>;

    @OneToMany(type => Post, post => post.twoSideCategory)
    twoSidePosts2: Promise<Post[]>;

    // ManyToMany with named properties
    @ManyToMany(type => Post, post => post.categoriesNamedTable)
    postsNamedTable: Promise<Post[]>;

    // OneToMany with named properties
    @OneToMany(type => Post, post => post.categoryNamedTable)
    onePostsNamedTable: Promise<Post[]>;

    // OneToOne with named properties
    @OneToOne(type => Post, post => post.oneCategoryNamedTable)
    onePostNamedTable: Promise<Post>;
}