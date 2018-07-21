import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {
    PrimaryGeneratedColumn,
    ManyToMany,
    JoinTable
} from "../../../../../lib/index";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {Category} from "./Category";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 500
    })
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}