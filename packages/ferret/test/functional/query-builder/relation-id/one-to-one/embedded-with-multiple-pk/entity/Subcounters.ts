import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {OneToOne} from "../../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../../lib/decorator/relations/JoinColumn";
import {User} from "./User";

export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

    @OneToOne(type => User)
    @JoinColumn()
    watchedUser: User;

    watchedUserId: number;

}