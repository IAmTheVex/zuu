import {Column, Entity, PrimaryGeneratedColumn} from "../../../../../lib";

export enum PostType {
    blog = "blog",
    news = "news",
    advertising = "advertising"
}

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "enum", enum: PostType, array: true })
    type: PostType[];

    @Column({ type: "int", array: true })
    numbers: number[];

}