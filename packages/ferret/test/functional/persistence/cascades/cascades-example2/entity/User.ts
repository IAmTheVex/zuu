import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Question} from "./Question";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Question, {
        cascade: ["insert"],
        nullable: true
    })
    question: Question;

}