import { Repository } from "../../../../../lib/repository/Repository";
import { EntityRepository } from "../../../../../lib/decorator/EntityRepository";
import {Category} from "../entity/Category";

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {

    findByName(name: string) {
        return this.findOne({ name });
    }

}