import {Column, Entity, PrimaryGeneratedColumn} from "../../../../../lib";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    title: string;

    @Column()
    likes: number;

}