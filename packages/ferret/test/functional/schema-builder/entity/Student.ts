import {Entity} from "../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Faculty} from "./Faculty";
import {ManyToOne} from "../../../../lib/decorator/relations/ManyToOne";
import {Teacher} from "./Teacher";
import {Index} from "../../../../lib/decorator/Index";

@Entity()
@Index("student_name_index", ["name"])
export class Student {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Faculty)
    faculty: Faculty;

    @ManyToOne(type => Teacher)
    teacher: Teacher;

}