import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Post} from "./Post";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";
import {ManyToMany} from "../../../../../lib/decorator/relations/ManyToMany";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
    
    @ManyToOne(type => Post, post => post.categories)
    post: Post;
    
    @ManyToMany(type => Post, post => post.manyCategories)
    manyPosts: Post[];

}