import {Entity} from "../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../lib/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Student} from "./Student";
import {OneToMany} from "../../../../lib/decorator/relations/OneToMany";

@Entity()
export class Teacher {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Student, student => student.teacher)
    students: Student[];

}