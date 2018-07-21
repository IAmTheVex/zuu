import {ChildEntity} from "../../../../../../../lib/decorator/entity/ChildEntity";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";
import {Employee} from "./Employee";
import {Specialization} from "./Specialization";

@ChildEntity()
export class Teacher extends Employee {

    @OneToMany(type => Specialization, specialization => specialization.teacher)
    specializations: Specialization[];

}
