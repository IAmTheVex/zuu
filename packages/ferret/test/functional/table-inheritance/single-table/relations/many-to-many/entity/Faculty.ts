import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {Entity} from "../../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {Student} from "./Student";

@Entity()
export class Faculty {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Student, student => student.faculties)
    students: Student[];

}
