import { Entity } from "../../../../../../lib/decorator/entity/Entity";
import { PrimaryGeneratedColumn } from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import { Column } from "../../../../../../lib/decorator/columns/Column";
import { ManyToMany } from "../../../../../../lib/decorator/relations/ManyToMany";
import { JoinTable } from "../../../../../../lib/decorator/relations/JoinTable";
import { ManyToOne } from "../../../../../../lib/decorator/relations/ManyToOne";
import { OneToOne } from "../../../../../../lib/decorator/relations/OneToOne";
import { JoinColumn } from "../../../../../../lib/decorator/relations/JoinColumn";
import {
    Category,
} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Promise<Category[]>;

    @ManyToMany(type => Category, category => category.twoSidePosts)
    @JoinTable()
    twoSideCategories: Promise<Category[]>;

    @Column()
    viewCount: number = 0;

    @ManyToOne(type => Category)
    category: Promise<Category>;

    @OneToOne(type => Category, category => category.onePost)
    @JoinColumn()
    oneCategory: Promise<Category>;

    @ManyToOne(type => Category, category => category.twoSidePosts2)
    twoSideCategory: Promise<Category>;
}
