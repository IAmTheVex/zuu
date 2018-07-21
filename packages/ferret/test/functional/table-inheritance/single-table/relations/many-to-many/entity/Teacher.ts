import {ChildEntity} from "../../../../../../../lib/decorator/entity/ChildEntity";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../../lib/decorator/relations/JoinTable";
import {Employee} from "./Employee";
import {Specialization} from "./Specialization";

@ChildEntity()
export class Teacher extends Employee {

    @ManyToMany(type => Specialization, specialization => specialization.teachers)
    @JoinTable({ name: "person_specs" })
    specializations: Specialization[];

}
