import { JsonController, Post, CurrentUser, BodyParam, HeaderParams } from "@zuu/mink";
import { GQLFactory } from "@zuu/owl";
import { GQLHelper } from "../GQLHelper";

GQLHelper.fill();

@JsonController(GQLHelper.queryPath)
export class AuthedGraphQLController {
    @Post()
    public async query(
        @CurrentUser({required: true}) user,
        @BodyParam("query", {required: true}) query: string,
        @BodyParam("variables") variables: Object,
        @BodyParam("operationName") operation: string,
        @HeaderParams() headers: any
    ) {
        let context = { user, ...(await GQLHelper.contextFiller(user, headers)) };
        return { ...await GQLFactory.run(query, context, variables, operation), __graph_result: true };
    }
}