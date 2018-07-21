import "reflect-metadata";
import {Connection} from "../../../../lib/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {expect} from "chai";
import {SqlServerDriver} from "../../../../lib/driver/sqlserver/SqlServerDriver";

describe("multi-schema-and-database > custom-junction-database", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post, Category],
            enabledDrivers: ["mysql"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create tables when custom table schema used", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        if (connection.driver instanceof SqlServerDriver) {
            const postTable = await queryRunner.getTable("yoman..post");
            const categoryTable = await queryRunner.getTable("yoman..category");
            const junctionMetadata = connection.getManyToManyMetadata(Post, "categories")!;
            const junctionTable = await queryRunner.getTable("yoman.." + junctionMetadata.tableName);
            expect(postTable).not.to.be.empty;
            postTable!.name!.should.be.equal("yoman..post");
            expect(categoryTable).not.to.be.empty;
            categoryTable!.name!.should.be.equal("yoman..category");
            expect(junctionTable).not.to.be.empty;
            junctionTable!.name!.should.be.equal("yoman.." + junctionMetadata.tableName);

        } else { // mysql
            const postTable = await queryRunner.getTable("yoman.post");
            const categoryTable = await queryRunner.getTable("yoman.category");
            const junctionMetadata = connection.getManyToManyMetadata(Post, "categories")!;
            const junctionTable = await queryRunner.getTable("yoman." + junctionMetadata.tableName);
            expect(postTable).not.to.be.empty;
            postTable!.name!.should.be.equal("yoman.post");
            expect(categoryTable).not.to.be.empty;
            categoryTable!.name!.should.be.equal("yoman.category");
            expect(junctionTable).not.to.be.empty;
            junctionTable!.name!.should.be.equal("yoman." + junctionMetadata.tableName);
        }
        await queryRunner.release();
    })));

});