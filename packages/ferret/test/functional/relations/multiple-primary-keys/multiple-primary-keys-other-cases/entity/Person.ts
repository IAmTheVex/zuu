import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../lib/decorator/relations/JoinColumn";
import {User} from "./User";

@Entity()
export class Person {

    @Column()
    fullName: string;

    @OneToOne(type => User, { primary: true })
    @JoinColumn()
    user: User;

}