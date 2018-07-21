import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";
import {Event} from "./Event";
import {User} from "./User";

@Entity()
export class EventMember {

    @ManyToOne(type => Event, event => event.members, { primary: true })
    event: Event;

    @ManyToOne(type => User, user => user.members, { primary: true })
    user: User;

}