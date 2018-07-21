import { Resolver, Query } from "@zuu/owl";
import { Test } from '../model/entities/Test';

@Resolver(Test)
export class TestResolver {
    @Query(returns => [Test])
    public async tests(): Promise<Test[]> {
        return await Test.find();
    }
}