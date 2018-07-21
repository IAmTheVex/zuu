import {ChildEntity} from "../../../../../../../lib/decorator/entity/ChildEntity";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {Person} from "./Person";
import {Faculty} from "./Faculty";
import {JoinTable} from "../../../../../../../lib/decorator/relations/JoinTable";

@ChildEntity()
export class Student extends Person {

    @ManyToMany(type => Faculty, faculty => faculty.students)
    @JoinTable()
    faculties: Faculty[];

}
