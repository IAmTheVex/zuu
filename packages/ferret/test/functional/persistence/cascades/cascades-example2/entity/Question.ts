import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Answer} from "./Answer";
import {OneToMany} from "../../../../../../lib/decorator/relations/OneToMany";

@Entity()
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Answer, answer => answer.question, { cascade: ["insert"] })
    answers: Answer[];

}