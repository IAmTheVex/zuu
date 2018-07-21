import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";
import {Teacher} from "./Teacher";

@Entity()
export class Specialization {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Teacher, teacher => teacher.specializations)
    teacher: Teacher;

}
