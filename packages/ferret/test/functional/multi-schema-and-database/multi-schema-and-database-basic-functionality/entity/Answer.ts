import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";

@Entity({ database: "secondDB",  schema: "answers" })
export class Answer {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @Column()
    questionId: number;

}