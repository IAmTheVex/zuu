import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {VersionColumn} from "../../../../../lib/decorator/columns/VersionColumn";
import {Category} from "./Category";
import {ManyToOne} from "../../../../../lib/decorator/relations/ManyToOne";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    rating: number;

    @VersionColumn()
    version: string;

    @ManyToOne(type => Category)
    category: Category;

}