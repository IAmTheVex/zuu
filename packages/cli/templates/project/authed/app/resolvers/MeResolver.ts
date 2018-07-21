import { Resolver, Query, Ctx } from "@zuu/owl";
import { User } from '../model/entities/User';

@Resolver()
export class MeResolver {
    @Query(returns => User)
    public async me(
        @Ctx("user") user: User
    ): Promise<User> {
        return user;
    }
}