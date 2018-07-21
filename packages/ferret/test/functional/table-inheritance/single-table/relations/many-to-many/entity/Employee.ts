import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {ChildEntity} from "../../../../../../../lib/decorator/entity/ChildEntity";
import {Person} from "./Person";

@ChildEntity()
export class Employee extends Person {

    @Column()
    salary: number;

}
