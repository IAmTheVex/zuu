import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {OneToMany} from "../../../../../../../lib/decorator/relations/OneToMany";
import {User} from "./User";

export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

    @OneToMany(type => User, user => user.post)
    watchedUsers: User[];

    watchedUserIds: number[];

}