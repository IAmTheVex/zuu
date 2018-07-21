import {Column} from "../../../../../../lib/decorator/columns/Column";
import {ChildEntity} from "../../../../../../lib/decorator/entity/ChildEntity";
import {Person} from "./Person";

@ChildEntity()
export class Student extends Person {

    @Column()
    faculty: string;

}
