import {Entity} from "../../../../lib/decorator/entity/Entity";
import {BaseEntity} from "../../../../lib/repository/BaseEntity";
import {PrimaryGeneratedColumn} from "../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../lib/decorator/columns/Column";
import {ManyToMany, JoinTable} from "../../../../lib";
import {Category} from "./Category";

@Entity()
export class Post extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({
        default: "This is default text."
    })
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}