import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Profile} from "./Profile";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(type => Profile, profile => profile.user, { cascade: ["insert"] })
    profile: Profile;

}