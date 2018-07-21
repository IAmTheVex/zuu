import {Column} from "../../../../../../../lib/decorator/columns/Column";
import {ManyToMany} from "../../../../../../../lib/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../../../lib/decorator/relations/JoinTable";
import {PrimaryColumn} from "../../../../../../../lib/decorator/columns/PrimaryColumn";
import {User} from "./User";

export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

    @ManyToMany(type => User, user => user.posts)
    @JoinTable({ name: "subcnt_users" })
    watchedUsers: User[];

    watchedUserIds: number[];

}