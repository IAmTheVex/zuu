import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {User} from "./User";
import {Generated} from "../../../../../lib/decorator/Generated";

@Entity()
export class AccessToken {

    @PrimaryColumn("int")
    @Generated()
    primaryKey: number;

    @OneToOne(type => User, user => user.access_token)
    @JoinColumn()
    user: User;

}
