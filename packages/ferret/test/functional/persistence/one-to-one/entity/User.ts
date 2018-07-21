import {AccessToken} from "./AccessToken";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Generated} from "../../../../../lib/decorator/Generated";

@Entity()
export class User {

    @PrimaryColumn("int")
    @Generated()
    primaryKey: number;

    @Column()
    email: string;

    @OneToOne(type => AccessToken, token => token.user)
    access_token: AccessToken;

}
