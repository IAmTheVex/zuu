import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {OneToOne} from "../../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../lib/decorator/relations/JoinColumn";
import {User} from "./User";
import {ManyToOne} from "../../../../../../lib/decorator/relations/ManyToOne";
import {Post} from "./Post";

@Entity()
export class Editor {

    @OneToOne(type => User, { eager: true, primary: true })
    @JoinColumn()
    user: User;

    @ManyToOne(type => Post, { primary: true })
    post: Post;

}