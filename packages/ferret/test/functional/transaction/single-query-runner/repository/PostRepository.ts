import {AbstractRepository} from "../../../../../lib/repository/AbstractRepository";
import {Post} from "../entity/Post";
import {EntityManager} from "../../../../../lib/entity-manager/EntityManager";
import {EntityRepository} from "../../../../../lib/decorator/EntityRepository";

@EntityRepository()
export class PostRepository extends AbstractRepository<Post> {

    save(post: Post) {
        return this.manager.save(post);
    }

    getManager(): EntityManager {
        return this.manager;
    }

}