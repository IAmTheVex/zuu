import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {User} from "./User";
import {ManyToOne} from "../../../../../../../lib/decorator/relations/ManyToOne";

export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

    @ManyToOne(type => User)
    watchedUser: User;

    watchedUserId: number;

}